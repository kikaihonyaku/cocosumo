import React from 'react';
import { Box, Container } from '@mui/material';
import InquiryAnalyticsDashboard from '../components/PropertyPublication/InquiryAnalyticsDashboard';

export default function InquiryAnalytics() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <InquiryAnalyticsDashboard />
    </Container>
  );
}
