import React, { useState, useEffect, useRef } from 'react';
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
  Link,
  Tooltip,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Send as SendIcon,
  RestartAlt as RestartAltIcon,
  Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
} from '@mui/icons-material';

export default function MapChatWidget({ property, accessToken, onPlaceClick, onWidgetTokenChange, onAddressesFound, rightOffset = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isMinimized, setIsMinimized] = useState(true); // 初期表示は最小化（閉じた状態）
  const [suggestions] = useState([
    '最寄り駅からのアクセス方法を教えてください',
    'この物件周辺のおすすめの飲食店を教えてください',
    '近くにスーパーやコンビニはありますか？',
    '周辺の治安や住みやすさについて教えてください',
    '近くに子供が通える病院はありますか？',
    'テニスの習い事がしたいです。近くにありますか？',
    '近くにバス停がありますか？',
  ]);
  const chatEndRef = useRef(null);

  // チャットの最下部に自動スクロール
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, loading]);

  const handleQuery = async (queryText = query) => {
    if (!queryText.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // ユーザーメッセージを即座にチャット欄に追加
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', text: queryText }
      ]);

      // 入力フィールドをクリア
      setQuery('');

      // 住所書式の指示を追加したクエリ
      const enhancedQuery = `${queryText}\n\n※施設や場所の住所を記載する際は、必ず「〒xxx-xxxx 〇〇県〇〇市...」の形式で郵便番号を含めて記載してください。`;

      const groundingUrl = accessToken
        ? `/api/v1/customer/${accessToken}/grounding`
        : `/api/v1/buildings/${property.id}/grounding`;
      const response = await fetch(groundingUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: enhancedQuery,
          latitude: property.latitude,
          longitude: property.longitude,
          conversation_history: conversationHistory,
        }),
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'AIからの応答取得に失敗しました');
        } else {
          const errorText = await response.text();
          console.error('Non-JSON error response:', errorText);
          throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }
      }

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setResponse(data);

        // Pass widget context token to parent
        if (data.widget_context_token && onWidgetTokenChange) {
          onWidgetTokenChange(data.widget_context_token);
        }

        const answerText = data.answer || data.text || '';

        // AIの応答のみを会話履歴に追加
        setConversationHistory(prev => [
          ...prev,
          { role: 'model', text: answerText }
        ]);

        // 回答から住所を抽出して親に通知
        if (onAddressesFound) {
          const addresses = extractAddresses(answerText);
          if (addresses.length > 0) {
            onAddressesFound(addresses);
          }
        }
      } else {
        throw new Error('予期しないレスポンス形式です');
      }

    } catch (err) {
      console.error('Grounding APIエラー:', err);
      setError(err.message || '周辺情報の取得に失敗しました');
      // エラー時は最後に追加したユーザーメッセージを削除
      setConversationHistory(prev => prev.slice(0, -1));
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

  const handleRefreshConversation = () => {
    setConversationHistory([]);
    setResponse(null);
    setQuery('');
    setError(null);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // 住所パターンを検出する正規表現
  // 日本の郵便番号付き住所形式: 〒xxx-xxxx 〇〇県〇〇市...
  const addressPatternJP = /〒\d{3}-\d{4}\s*[^\n〒。！？）)]+/g;
  // 英語形式: "6-chōme-6-16 Bingohigashi, Kasukabe, Saitama 344-0032, Japan"
  const addressPatternEN = /[\d\w\-ō]+\s+[\w\-ō]+(?:,\s*[\w\-ō\s]+){2,},\s*Japan/gi;

  // テキストから住所と名称を抽出する関数
  const extractAddresses = (text) => {
    if (!text || typeof text !== 'string') return [];

    const matches = [];

    // 日本語形式の住所を検出
    let match;
    const patternJP = new RegExp(addressPatternJP);
    while ((match = patternJP.exec(text)) !== null) {
      matches.push({ index: match.index, length: match[0].length, address: match[0] });
    }

    // 英語形式の住所を検出
    const patternEN = new RegExp(addressPatternEN);
    while ((match = patternEN.exec(text)) !== null) {
      matches.push({ index: match.index, length: match[0].length, address: match[0] });
    }

    // マッチをインデックス順にソート
    matches.sort((a, b) => a.index - b.index);

    // 重複を除去（重なっている場合は先に見つかったものを優先）
    const uniqueMatches = [];
    for (const m of matches) {
      const isOverlapping = uniqueMatches.some(
        um => (m.index >= um.index && m.index < um.index + um.length) ||
              (um.index >= m.index && um.index < m.index + m.length)
      );
      if (!isOverlapping) {
        uniqueMatches.push(m);
      }
    }

    // 住所の前にある名称を抽出
    return uniqueMatches.map(m => {
      // 住所の前の部分を取得（同じ行内）
      const beforeText = text.substring(0, m.index);
      const lastNewline = beforeText.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const lineBeforeAddress = text.substring(lineStart, m.index).trim();

      // 名称を抽出（**太字**、番号付きリスト、箇条書きなどを考慮）
      let name = '';

      // **名称** 形式を検出
      const boldMatch = lineBeforeAddress.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        name = boldMatch[1].trim();
      } else {
        // 「1. 名称:」「- 名称:」「・名称:」などの形式
        const listMatch = lineBeforeAddress.match(/^[\d\.\-\*・•]+\s*(.+?)[:：]?\s*$/);
        if (listMatch) {
          name = listMatch[1].trim();
        } else {
          // 住所の直前のテキスト（コロンや括弧で区切られている場合）
          const colonMatch = lineBeforeAddress.match(/([^:：]+)[:：]\s*$/);
          if (colonMatch) {
            name = colonMatch[1].trim();
            // さらに番号やリストマーカーを除去
            name = name.replace(/^[\d\.\-\*・•]+\s*/, '').trim();
          }
        }
      }

      return { address: m.address, name: name || '' };
    });
  };

  // テキスト内の住所を検出してクリック可能なリンクに変換
  const processTextWithAddresses = (text) => {
    if (!text || typeof text !== 'string') return text;

    const parts = [];
    let lastIndex = 0;
    const matches = [];

    // 日本語形式の住所を検出
    let match;
    const patternJP = new RegExp(addressPatternJP);
    while ((match = patternJP.exec(text)) !== null) {
      matches.push({ index: match.index, length: match[0].length, address: match[0] });
    }

    // 英語形式の住所を検出
    const patternEN = new RegExp(addressPatternEN);
    while ((match = patternEN.exec(text)) !== null) {
      matches.push({ index: match.index, length: match[0].length, address: match[0] });
    }

    // マッチをインデックス順にソート
    matches.sort((a, b) => a.index - b.index);

    // 重複を除去（重なっている場合は先に見つかったものを優先）
    const uniqueMatches = [];
    for (const m of matches) {
      const isOverlapping = uniqueMatches.some(
        um => (m.index >= um.index && m.index < um.index + um.length) ||
              (um.index >= m.index && um.index < m.index + m.length)
      );
      if (!isOverlapping) {
        uniqueMatches.push(m);
      }
    }

    // テキストを構築
    for (const match of uniqueMatches) {
      const address = match.address;

      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

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

      lastIndex = match.index + match.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // ReactMarkdownのカスタムコンポーネント
  const markdownComponents = {
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

  // 位置情報が設定されていない場合
  if (!property?.latitude || !property?.longitude) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16 + rightOffset,
        width: 'auto',
        maxWidth: rightOffset > 0 ? 'none' : 1200,
        zIndex: 10,
      }}
    >
      {/* 統合チャットウィジェット */}
      <Paper
        elevation={4}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          height: isMinimized ? 'auto' : 400,
        }}
      >
        {/* ヘッダー - 最小化時も表示 */}
        {!isMinimized && (
          <Box sx={{
            px: 2,
            py: 1,
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
              <PsychologyIcon color="primary" fontSize="small" />
              AI周辺情報
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="最小化">
                <IconButton
                  size="small"
                  onClick={toggleMinimize}
                >
                  <MinimizeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {conversationHistory.length > 0 && (
                <Tooltip title="会話をクリア">
                  <IconButton
                    size="small"
                    onClick={handleRefreshConversation}
                    disabled={loading}
                  >
                    <RestartAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}

        {/* チャット履歴表示エリア - 最小化時は非表示 */}
        {!isMinimized && (
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            minHeight: 0, // フレックスアイテムのスクロールに必要
          }}
          >
          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* チャットメッセージ */}
          {conversationHistory.length > 0 ? (
            <Box>
              {conversationHistory.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1.5,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      maxWidth: '85%',
                      bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                      color: message.role === 'user' ? 'white' : 'text.primary',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      ...(message.role === 'user' && {
                        borderTopRightRadius: 4,
                      }),
                      ...(message.role === 'model' && {
                        borderTopLeftRadius: 4,
                      }),
                    }}
                  >
                    {message.role === 'user' ? (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                        {message.text}
                      </Typography>
                    ) : (
                      <Box sx={{
                        '& h1': { fontSize: '1.1rem', fontWeight: 600, mt: 0.5, mb: 0.5 },
                        '& h2': { fontSize: '1rem', fontWeight: 600, mt: 0.5, mb: 0.5 },
                        '& h3': { fontSize: '0.95rem', fontWeight: 600, mt: 0.5, mb: 0.25 },
                        '& p': { mb: 0.5, lineHeight: 1.5, fontSize: '0.875rem' },
                        '& ul, & ol': { pl: 2, mb: 0.5 },
                        '& li': { mb: 0.25, fontSize: '0.875rem' },
                        '& strong': { fontWeight: 600 },
                      }}>
                        <ReactMarkdown components={markdownComponents}>
                          {message.text || 'データがありません'}
                        </ReactMarkdown>
                      </Box>
                    )}
                  </Paper>
                </Box>
              ))}

              {/* ローディング中のインジケーター */}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.100', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary" fontSize="0.85rem">
                        AIが回答を生成しています...
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}

              <div ref={chatEndRef} />
            </Box>
          ) : (
            <Box>
              {/* 提案クエリ */}
              {suggestions.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    質問の候補:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                          fontSize: '0.8rem',
                          py: 0.5,
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
        )}

        {/* 入力エリア（下部固定） */}
        <Box sx={{
          p: 1.5,
          borderTop: isMinimized ? 'none' : '1px solid #e0e0e0',
          bgcolor: 'white',
          flexShrink: 0,
        }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            {/* 最小化時の展開ボタン */}
            {isMinimized && (
              <Tooltip title="展開">
                <IconButton
                  size="small"
                  onClick={toggleMinimize}
                  sx={{ mb: 0.5 }}
                >
                  <MaximizeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* AIアイコン */}
            {isMinimized && (
              <PsychologyIcon color="primary" sx={{ fontSize: 24, mb: 0.5 }} />
            )}

            {/* 入力フィールド */}
            <TextField
              fullWidth
              size="small"
              placeholder="周辺について質問してください..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                // 入力欄がフォーカスされたら展開
                if (isMinimized) {
                  setIsMinimized(false);
                }
              }}
              disabled={loading}
              multiline
              maxRows={2}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'grey.50',
                }
              }}
            />

            {/* 送信ボタン */}
            <Button
              variant="contained"
              onClick={() => handleQuery()}
              disabled={loading || !query.trim()}
              sx={{ minWidth: 48, height: 40 }}
            >
              <SendIcon fontSize="small" />
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
