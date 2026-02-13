import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Collapse
} from '@mui/material';
import {
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { getActivityIcon, getActivityDotColor } from './activityUtils';

const NOTES_DISMISSED_KEY = 'cocosumo_tracking_notes_dismissed';

const formatTimestamp = (ts) => {
  if (!ts) return '-';
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);
  if (isNaN(d.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function DeliveryStatusSection({ metadata, activityType }) {
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(NOTES_DISMISSED_KEY);
    if (!dismissed) {
      setNotesOpen(true);
      localStorage.setItem(NOTES_DISMISSED_KEY, '1');
    }
  }, []);

  const isEmail = activityType === 'email' || activityType === 'inquiry_replied';
  const isLine = activityType === 'line_message';

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        📊 配信状況
      </Typography>

      {isEmail && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {(metadata.email_bounced_at || metadata.email_dropped_at) && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
              <Typography variant="body2" color="error.main" sx={{ fontWeight: 600, minWidth: 80 }}>
                ⚠ 配信失敗:
              </Typography>
              <Typography variant="body2" color="error.main">
                {metadata.email_bounce_reason || metadata.email_drop_reason || '不明'}
              </Typography>
            </Box>
          )}

          {metadata.email_delivered_at && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                配信:
              </Typography>
              <Typography variant="body2">
                ✓ {formatTimestamp(metadata.email_delivered_at)}
              </Typography>
            </Box>
          )}

          {metadata.email_opened_at && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                開封:
              </Typography>
              <Typography variant="body2">
                {metadata.email_open_count || 1}回
                （初回: {formatTimestamp(metadata.email_opened_at)}
                {metadata.email_last_opened_at && metadata.email_last_opened_at !== metadata.email_opened_at
                  ? ` / 最新: ${formatTimestamp(metadata.email_last_opened_at)}`
                  : ''}）
              </Typography>
            </Box>
          )}

          {metadata.email_clicked_at && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                クリック:
              </Typography>
              <Typography variant="body2">
                {metadata.email_click_count || 1}回
                （初回: {formatTimestamp(metadata.email_clicked_at)}）
              </Typography>
            </Box>
          )}

          {!metadata.email_delivered_at && !metadata.email_bounced_at && !metadata.email_dropped_at && (
            <Typography variant="body2" color="text.secondary">
              配信情報はまだ受信されていません
            </Typography>
          )}
        </Box>
      )}

      {isLine && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {metadata.line_link_clicked_at ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
                リンククリック:
              </Typography>
              <Typography variant="body2">
                {metadata.line_click_count || 1}回
                （初回: {formatTimestamp(metadata.line_link_clicked_at)}
                {metadata.line_last_clicked_at && metadata.line_last_clicked_at !== metadata.line_link_clicked_at
                  ? ` / 最新: ${formatTimestamp(metadata.line_last_clicked_at)}`
                  : ''}）
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              リンククリックはまだ記録されていません
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Button
          size="small"
          onClick={() => setNotesOpen(!notesOpen)}
          endIcon={notesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem', p: 0 }}
        >
          ⚠ 注意事項
        </Button>
        <Collapse in={notesOpen}>
          <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, fontSize: '0.75rem' }}>
            {isEmail && (
              <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5 } }}>
                <li>
                  <Typography variant="caption" color="text.secondary">
                    メールの開封検知はメール内の画像読み込みに依存しています。画像をブロックしているメールソフトでは開封が検知されません
                  </Typography>
                </li>
                <li>
                  <Typography variant="caption" color="text.secondary">
                    Apple Mail のプライバシー保護機能により、実際に開封していなくても開封として記録される場合があります
                  </Typography>
                </li>
                <li>
                  <Typography variant="caption" color="text.secondary">
                    開封回数はプレビューなども含むため、実際の閲覧回数とは異なる場合があります
                  </Typography>
                </li>
                <li>
                  <Typography variant="caption" color="text.secondary">
                    配信済みはメールサーバーへの到達を意味し、受信トレイへの配信を保証するものではありません
                  </Typography>
                </li>
              </Box>
            )}
            {isLine && (
              <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5 } }}>
                <li>
                  <Typography variant="caption" color="text.secondary">
                    LINE の既読情報は LINE の仕様上取得できないため、メッセージ内のリンクがクリックされたかどうかで反応を判定しています
                  </Typography>
                </li>
                <li>
                  <Typography variant="caption" color="text.secondary">
                    リンクを含まないテキストメッセージの反応は追跡できません
                  </Typography>
                </li>
                <li>
                  <Typography variant="caption" color="text.secondary">
                    クリック追跡はメッセージ内のリンク（物件カード等）を経由した場合のみ記録されます
                  </Typography>
                </li>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

export default function ActivityDetailDialog({ open, onClose, activity }) {
  if (!activity) return null;

  const dotColor = getActivityDotColor(activity.activity_type);
  const showTracking = activity.direction === 'outbound' &&
    (activity.activity_type === 'email' || activity.activity_type === 'line_message' || activity.activity_type === 'inquiry_replied');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: `${dotColor}.light`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${dotColor}.main`,
            flexShrink: 0
          }}
        >
          {getActivityIcon(activity.activity_type, activity.direction)}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
            {activity.subject || activity.activity_type_label}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
            <Chip size="small" label={activity.activity_type_label} sx={{ height: 20, fontSize: '0.7rem' }} />
            {activity.direction_label && (
              <Chip size="small" label={activity.direction_label} variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {activity.content ? (
          activity.content_format === 'html' ? (
            <Box
              sx={{
                '& p': { m: 0, mb: 1 },
                '& p:last-child': { mb: 0 },
                '& ul, & ol': { m: 0, pl: 2.5 },
                '& blockquote': { m: 0, pl: 1.5, borderLeft: '3px solid', borderColor: 'divider', color: 'text.secondary' },
                '& a': { color: 'primary.main' },
                fontSize: '0.875rem',
                lineHeight: 1.7,
                mb: 2,
              }}
              dangerouslySetInnerHTML={{ __html: activity.content }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: 2 }}
            >
              {activity.content}
            </Typography>
          )
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            詳細内容なし
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              登録日時:
            </Typography>
            <Typography variant="body2">
              {activity.formatted_created_at}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              登録者:
            </Typography>
            <Typography variant="body2">
              {activity.user?.name || '-'}
            </Typography>
          </Box>
        </Box>

        {showTracking && (
          <>
            <Divider sx={{ my: 2 }} />
            <DeliveryStatusSection
              metadata={activity.metadata || {}}
              activityType={activity.activity_type}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
