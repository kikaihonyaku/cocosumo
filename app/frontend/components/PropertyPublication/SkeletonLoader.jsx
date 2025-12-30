import React from 'react';
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Grid,
  Stack
} from '@mui/material';

/**
 * Property Publication Skeleton Loader
 * Shows loading skeleton while the property data is being fetched
 */
export default function SkeletonLoader() {
  return (
    <Box sx={{ bgcolor: '#f9f9f9', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Paper sx={{ mb: 3, overflow: 'hidden' }}>
          {/* Title Bar */}
          <Box sx={{ bgcolor: 'primary.main', px: 3, py: 2 }}>
            <Skeleton
              variant="text"
              width="60%"
              height={36}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
            />
            <Skeleton
              variant="text"
              width="40%"
              height={20}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', mt: 1 }}
            />
          </Box>

          {/* Price and Info */}
          <Box sx={{ px: 3, py: 3 }}>
            <Skeleton variant="text" width={180} height={48} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={60} height={24} />
              <Skeleton variant="rounded" width={50} height={24} />
            </Stack>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* Photo Gallery Skeleton */}
            <Paper sx={{ mb: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', px: 2, py: 1.5 }}>
                <Skeleton
                  variant="text"
                  width={120}
                  height={24}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Box>
              <Box sx={{ p: 2 }}>
                {/* Main Image */}
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={400}
                  sx={{ borderRadius: 1, mb: 2 }}
                />
                {/* Thumbnails */}
                <Stack direction="row" spacing={1}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rectangular"
                      width={80}
                      height={60}
                      sx={{ borderRadius: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            </Paper>

            {/* PR Text Skeleton */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="95%" height={20} />
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="85%" height={20} />
            </Paper>

            {/* Property Details Table Skeleton */}
            <Paper sx={{ mb: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', px: 2, py: 1.5 }}>
                <Skeleton
                  variant="text"
                  width={100}
                  height={24}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Box>
              <Box sx={{ p: 0 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      borderBottom: '1px solid #e0e0e0',
                      bgcolor: i % 2 === 0 ? 'white' : '#fafafa'
                    }}
                  >
                    <Box sx={{ width: '35%', p: 2 }}>
                      <Skeleton variant="text" width="80%" height={24} />
                    </Box>
                    <Box sx={{ width: '65%', p: 2 }}>
                      <Skeleton variant="text" width="60%" height={24} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ mb: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', px: 2, py: 1.5 }}>
                <Skeleton
                  variant="text"
                  width={120}
                  height={24}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Box>
              <Box sx={{ p: 2 }}>
                {/* Form Fields */}
                <Skeleton variant="text" width="100%" height={24} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" width="100%" height={100} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" width="100%" height={48} />
              </Box>

              {/* Share Buttons */}
              <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                <Skeleton variant="text" width={60} height={20} sx={{ mb: 1 }} />
                <Stack direction="row" spacing={1}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} variant="circular" width={36} height={36} />
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/**
 * Compact skeleton for template loading fallback
 */
export function TemplateSkeletonFallback() {
  return (
    <Box sx={{ p: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ mb: 2, borderRadius: 1 }} />
            <Skeleton variant="text" width="80%" height={32} />
            <Skeleton variant="text" width="60%" height={24} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/**
 * Inline skeleton for section loading
 */
export function SectionSkeleton({ height = 200 }) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
    </Paper>
  );
}
