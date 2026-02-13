import React from 'react';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Key as KeyIcon,
  Chat as ChatIcon,
  Flag as FlagIcon,
  Note as NoteIcon,
  Visibility as VisibilityIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  AutoAwesome as AutoAwesomeIcon,
  SmartToy as SmartToyIcon,
  Directions as DirectionsIcon,
  Block as BlockIcon,
  Update as UpdateIcon,
  Reply as ReplyIcon,
  MergeType as MergeTypeIcon
} from '@mui/icons-material';

// Activity type icons
export const getActivityIcon = (activityType, direction) => {
  const iconMap = {
    phone_call: direction === 'outbound' ? <CallMadeIcon /> : direction === 'inbound' ? <CallReceivedIcon /> : <PhoneIcon />,
    email: <EmailIcon />,
    visit: <PersonIcon />,
    viewing: <VisibilityIcon />,
    note: <NoteIcon />,
    line_message: <ChatIcon />,
    inquiry: <QuestionAnswerIcon />,
    access_issued: <KeyIcon />,
    status_change: <FlagIcon />,
    assigned_user_change: <PersonIcon />,
    portal_viewed: <VisibilityIcon />,
    ai_simulation: <AutoAwesomeIcon />,
    ai_grounding: <SmartToyIcon />,
    customer_route_created: <DirectionsIcon />,
    access_revoked: <BlockIcon />,
    access_extended: <UpdateIcon />,
    inquiry_replied: <ReplyIcon />,
    customer_merged: <MergeTypeIcon />
  };
  return iconMap[activityType] || <NoteIcon />;
};

// Activity dot color
export const getActivityDotColor = (activityType) => {
  const colorMap = {
    phone_call: 'primary',
    email: 'info',
    visit: 'success',
    viewing: 'secondary',
    note: 'grey',
    line_message: 'success',
    inquiry: 'warning',
    access_issued: 'info',
    status_change: 'primary',
    assigned_user_change: 'secondary',
    portal_viewed: 'warning',
    ai_simulation: 'secondary',
    ai_grounding: 'secondary',
    customer_route_created: 'info',
    access_revoked: 'error',
    access_extended: 'success',
    inquiry_replied: 'primary',
    customer_merged: 'warning'
  };
  return colorMap[activityType] || 'grey';
};

// Activity type label map (for chat view)
export const ACTIVITY_TYPE_LABELS = {
  line_message: 'LINE',
  email: 'メール',
  phone_call: '電話',
  visit: '来店',
  viewing: '内見',
  note: 'メモ',
  inquiry: '問い合わせ'
};

// Chat-visible activity types
export const CHAT_ACTIVITY_TYPES = ['line_message', 'email', 'phone_call', 'visit', 'viewing', 'note', 'inquiry'];

// Filter activities by selected inquiry/property inquiry
export const filterActivities = (activities, selectedInquiryId, selectedPropertyInquiryId) => {
  if (selectedPropertyInquiryId) {
    return activities.filter(a => a.property_inquiry_id === selectedPropertyInquiryId);
  }
  if (selectedInquiryId) {
    return activities.filter(a => a.inquiry_id === selectedInquiryId);
  }
  return activities;
};
