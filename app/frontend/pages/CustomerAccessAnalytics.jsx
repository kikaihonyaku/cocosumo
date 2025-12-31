import React from 'react';
import { Container } from '@mui/material';
import CustomerAccessAnalyticsDashboard from '../components/CustomerAccess/CustomerAccessAnalyticsDashboard';

export default function CustomerAccessAnalytics() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomerAccessAnalyticsDashboard />
    </Container>
  );
}
