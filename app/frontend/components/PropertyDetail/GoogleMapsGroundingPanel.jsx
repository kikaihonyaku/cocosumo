import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Divider,
  Link,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Place as PlaceIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';

export default function GoogleMapsGroundingPanel({ property, onPlaceClick }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]); // 会話履歴を保持
  const [suggestions, setSuggestions] = useState([
    'この物件周辺のおすすめの飲食店を教えてください',
    '最寄り駅からのアクセス方法を教えてください',
    '近くにスーパーやコンビニはありますか？',
    '周辺の治安や住みやすさについて教えてください',
  ]);

  // デバッグ用: 物件データをコンソールに出力
  useEffect(() => {
    console.log('GoogleMapsGroundingPanel - property:', property);
    console.log('Latitude:', property?.latitude);
    console.log('Longitude:', property?.longitude);
  }, [property]);

  // デフォルトクエリを自動実行
  // MEMO: 開発中は自動実行を無効化
  // useEffect(() => {
  //   if (property?.address && property?.latitude && property?.longitude && !response && !loading) {
  //     const defaultQuery = `${property.address}周辺の生活環境について教えてください。近くにある便利な施設やおすすめのスポットを紹介してください。`;
  //     handleQuery(defaultQuery);
  //   }
  // }, [property?.address, property?.latitude, property?.longitude]);

  const handleQuery = async (queryText = query) => {
    if (!queryText.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/buildings/${property.id}/grounding`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          latitude: property.latitude,
          longitude: property.longitude,
          conversation_history: conversationHistory, // 会話履歴を送信
        }),
      });

      // レスポンスのContent-Typeを確認
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        // JSONレスポンスの場合
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'AIからの応答取得に失敗しました');
        } else {
          // HTMLエラーページなどの場合
          const errorText = await response.text();
          console.error('Non-JSON error response:', errorText);
          throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }
      }

      // 成功レスポンスもJSONであることを確認
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Grounding API response:', data);
        setResponse(data);

        // 会話履歴に追加
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', text: queryText },
          { role: 'model', text: data.answer || data.text || '' }
        ]);

        setQuery('');
      } else {
        throw new Error('予期しないレスポンス形式です');
      }

    } catch (err) {
      console.error('Grounding APIエラー:', err);
      setError(err.message || '周辺情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleQuery(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  // 会話をリフレッシュ（会話履歴をクリア）
  const handleRefreshConversation = () => {
    setConversationHistory([]);
    setResponse(null);
    setQuery('');
    setError(null);
    console.log('会話履歴をクリアしました');
  };

  // 住所パターンを検出する正規表現
  // 例: "6-chōme-6-16 Bingohigashi, Kasukabe, Saitama 344-0032, Japan"
  const addressPattern = /[\d\w\-ō]+\s+[\w\-ō]+(?:,\s*[\w\-ō\s]+){2,},\s*Japan/gi;

  // テキスト内の住所を検出してクリック可能なリンクに変換
  const processTextWithAddresses = (text) => {
    if (!text || typeof text !== 'string') return text;

    const parts = [];
    let lastIndex = 0;
    let match;

    // 正規表現パターンをリセット
    const pattern = new RegExp(addressPattern);

    while ((match = pattern.exec(text)) !== null) {
      const address = match[0];

      // マッチ前のテキスト
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // 住所部分をリンクとして追加
      parts.push(
        <Link
          key={`address-${match.index}`}
          component="button"
          variant="body2"
          onClick={(e) => {
            e.preventDefault();
            if (onPlaceClick) {
              onPlaceClick(address);
            }
          }}
          sx={{
            color: 'primary.main',
            textDecoration: 'underline',
            cursor: 'pointer',
            display: 'inline',
            '&:hover': {
              color: 'primary.dark',
              textDecoration: 'underline',
            }
          }}
        >
          {address}
        </Link>
      );

      lastIndex = pattern.lastIndex;
    }

    // 残りのテキスト
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // ReactMarkdownのカスタムコンポーネント
  const markdownComponents = {
    // テキストノードを処理
    p: ({ children, ...props }) => {
      const processedChildren = React.Children.map(children, child => {
        if (typeof child === 'string') {
          return processTextWithAddresses(child);
        }
        return child;
      });
      return <p {...props}>{processedChildren}</p>;
    },
    li: ({ children, ...props }) => {
      const processedChildren = React.Children.map(children, child => {
        if (typeof child === 'string') {
          return processTextWithAddresses(child);
        }
        return child;
      });
      return <li {...props}>{processedChildren}</li>;
    },
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        minHeight: 56
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, fontWeight: 600, fontSize: '1.05rem' }}>
          <PsychologyIcon color="primary" sx={{ fontSize: 26 }} />
          AI周辺情報
        </Typography>

        {/* 会話リフレッシュボタン */}
        {(response || conversationHistory.length > 0) && (
          <IconButton
            size="small"
            onClick={handleRefreshConversation}
            disabled={loading}
            title="会話をリフレッシュ"
            sx={{ mr: 0.5 }}
          >
            <RestartAltIcon />
          </IconButton>
        )}

        {/* 最後の質問を再読み込み */}
        {response && (
          <IconButton
            size="small"
            onClick={() => handleQuery(response.query)}
            disabled={loading}
            title="再読み込み"
          >
            <RefreshIcon />
          </IconButton>
        )}
      </Box>

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 応答表示エリア */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography color="text.secondary">
              AIが周辺情報を取得しています...
            </Typography>
          </Box>
        ) : response ? (
          <Box>
            {/* 位置情報表示 */}
            {property?.address && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlaceIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {property.address}
                </Typography>
              </Box>
            )}

            {/* AI応答 */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
              <Box sx={{
                '& h1': { fontSize: '1.5rem', fontWeight: 600, mt: 2, mb: 1 },
                '& h2': { fontSize: '1.3rem', fontWeight: 600, mt: 2, mb: 1 },
                '& h3': { fontSize: '1.1rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
                '& p': { mb: 1, lineHeight: 1.7 },
                '& ul, & ol': { pl: 3, mb: 1 },
                '& li': { mb: 0.5 },
                '& strong': { fontWeight: 600 },
                '& em': { fontStyle: 'italic' },
                '& code': {
                  bgcolor: 'grey.200',
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                },
                '& pre': {
                  bgcolor: 'grey.200',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  mb: 1
                },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  pl: 2,
                  ml: 0,
                  fontStyle: 'italic',
                  color: 'text.secondary'
                }
              }}>
                <ReactMarkdown components={markdownComponents}>
                  {response.answer || response.text || 'データがありません'}
                </ReactMarkdown>
              </Box>
              {response.is_mock && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  デモモードで動作中です。実際のVertex AI APIへの接続に失敗したため、モックレスポンスを表示しています。
                </Alert>
              )}
            </Paper>

            {/* 参照元（Google Maps情報） */}
            {response.sources && response.sources.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  情報提供元: Google Maps
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {response.sources.map((source, index) => (
                    <Chip
                      key={index}
                      label={source.name || `場所 ${index + 1}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : !property?.latitude || !property?.longitude ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <PlaceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary" gutterBottom>
              位置情報が設定されていません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AI周辺情報を利用するには、地図で物件の位置を設定してください
            </Typography>
            <Typography variant="caption" color="text.secondary">
              緯度: {property?.latitude || '未設定'} / 経度: {property?.longitude || '未設定'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary" gutterBottom>
              この物件周辺の情報をAIに質問できます
            </Typography>
            <Typography variant="body2" color="text.secondary">
              下の候補から選ぶか、自由に質問してください
            </Typography>
          </Box>
        )}

        {/* 提案クエリ */}
        {!loading && suggestions.length > 0 && property?.latitude && property?.longitude && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              質問の候補:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={loading}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Divider />

      {/* 入力エリア */}
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="周辺について質問してください..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            multiline
            maxRows={3}
          />
          <Button
            variant="contained"
            onClick={() => handleQuery()}
            disabled={loading || !query.trim()}
            sx={{ minWidth: '48px', px: 2 }}
          >
            <SendIcon fontSize="small" />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
