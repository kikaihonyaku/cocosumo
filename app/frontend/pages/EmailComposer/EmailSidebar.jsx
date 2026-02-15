import React, { useState, useCallback } from 'react';
import { Box, Tabs, Tab, Divider, useMediaQuery, useTheme } from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Link as LinkIcon
} from '@mui/icons-material';

import PropertyImagePicker from './PropertyImagePicker';
import PropertyCardInserter from './PropertyCardInserter';
import RoomSearchField from './RoomSearchField';
import ContentLinkList from './ContentLinkList';
import AllPublishedContentList from './AllPublishedContentList';
import MyPageLinkList from './MyPageLinkList';

export default function EmailSidebar({
  propertyPhotos,
  photosLoading,
  editor,
  roomContent,
  roomContentLoading,
  onLoadRoomContent,
  customerAccesses,
  customerAccessesLoading,
  isMobile
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [searchedRoom, setSearchedRoom] = useState(null);
  const [linkSearchedRoom, setLinkSearchedRoom] = useState(null);
  const [linkMode, setLinkMode] = useState('room'); // 'room' | 'all'

  const handleSearchRoomChange = useCallback((room) => {
    setSearchedRoom(room);
    if (room) onLoadRoomContent(room.id);
  }, [onLoadRoomContent]);

  const handleLinkSearchRoomChange = useCallback((room) => {
    setLinkSearchedRoom(room);
    if (room) onLoadRoomContent(room.id);
  }, [onLoadRoomContent]);

  // Convert roomContent photos to the format PropertyImagePicker/PropertyCardInserter expects
  const searchedPropertyPhotos = roomContent ? [{
    property_inquiry_id: `search-${roomContent.room?.id}`,
    property_title: `${roomContent.room?.building_name || ''} ${roomContent.room?.room_number || ''}`.trim(),
    building_name: roomContent.room?.building_name,
    room_number: roomContent.room?.room_number,
    room_type: roomContent.room?.room_type_label,
    area: roomContent.room?.area,
    rent: roomContent.room?.rent,
    building_photos: roomContent.building_photos || [],
    room_photos: roomContent.room_photos || [],
    publication_url: roomContent.property_publications?.[0]
      ? `/property/${roomContent.property_publications[0].publication_id}`
      : null
  }] : [];

  return (
    <Box sx={{ width: isMobile ? 300 : '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="fullWidth"
        textColor="inherit"
        TabIndicatorProps={{ sx: { bgcolor: 'grey.600' } }}
        sx={{
          minHeight: 36,
          color: 'grey.700',
          '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 1, fontSize: '0.7rem', minWidth: 0 },
        }}
      >
        <Tab icon={<HomeIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="案件" />
        <Tab icon={<SearchIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="検索" />
        <Tab icon={<LinkIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="リンク" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Tab 0: 案件の物件（既存動作） */}
        {tabIndex === 0 && (
          <Box>
            <PropertyImagePicker
              propertyPhotos={propertyPhotos}
              photosLoading={photosLoading}
              editor={editor}
            />
            <Divider sx={{ my: 1 }} />
            <PropertyCardInserter
              propertyPhotos={propertyPhotos}
              editor={editor}
            />
          </Box>
        )}

        {/* Tab 1: 物件を検索 */}
        {tabIndex === 1 && (
          <Box sx={{ p: 1 }}>
            <RoomSearchField
              value={searchedRoom}
              onChange={handleSearchRoomChange}
            />

            {searchedRoom && (
              <Box sx={{ mt: 1 }}>
                <PropertyImagePicker
                  propertyPhotos={searchedPropertyPhotos}
                  photosLoading={roomContentLoading}
                  editor={editor}
                />
                <Divider sx={{ my: 1 }} />
                <PropertyCardInserter
                  propertyPhotos={searchedPropertyPhotos}
                  editor={editor}
                />
                <Divider sx={{ my: 1 }} />
                <ContentLinkList
                  roomContent={roomContent}
                  loading={roomContentLoading}
                  editor={editor}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Tab 2: リンク */}
        {tabIndex === 2 && (
          <Box sx={{ p: 1 }}>
            <Tabs
              value={linkMode}
              onChange={(_, v) => setLinkMode(v)}
              variant="fullWidth"
              textColor="inherit"
              TabIndicatorProps={{ sx: { bgcolor: 'grey.600' } }}
              sx={{
                minHeight: 28,
                mb: 1,
                color: 'grey.700',
                '& .MuiTab-root': { minHeight: 28, py: 0.25, fontSize: '0.65rem', minWidth: 0 },
              }}
            >
              <Tab value="room" label="物件から検索" />
              <Tab value="all" label="全コンテンツ" />
            </Tabs>

            {linkMode === 'room' && (
              <Box>
                <RoomSearchField
                  value={linkSearchedRoom}
                  onChange={handleLinkSearchRoomChange}
                />
                {linkSearchedRoom && (
                  <Box sx={{ mt: 1 }}>
                    <ContentLinkList
                      roomContent={roomContent}
                      loading={roomContentLoading}
                      editor={editor}
                    />
                  </Box>
                )}
              </Box>
            )}

            {linkMode === 'all' && (
              <AllPublishedContentList editor={editor} />
            )}

            <Divider sx={{ my: 1 }} />
            <MyPageLinkList
              accesses={customerAccesses}
              loading={customerAccessesLoading}
              editor={editor}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
