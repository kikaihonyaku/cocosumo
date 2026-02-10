import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import muiTheme from '../../theme/muiTheme';

import FloorplanUploadStep from './FloorplanUploadStep';
import BuildingInfoStep from './BuildingInfoStep';
import RoomInfoStep from './RoomInfoStep';
import SimilarBuildingSelector from './SimilarBuildingSelector';

const steps = ['募集図面', '建物情報', '部屋情報', '確認'];

export default function FloorplanRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  onStartMapPick,
  initialLocation = null,
}) {
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const mapPickingRef = React.useRef(false);

  // PDF file state
  const [pdfFile, setPdfFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  // Extracted data from AI
  const [extractedData, setExtractedData] = useState(null);

  // Similar buildings
  const [similarBuildings, setSimilarBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Building form data
  const [buildingData, setBuildingData] = useState({
    name: "",
    address: "",
    building_type: "mansion",
    structure: "",
    floors: "",
    built_date: "",
    total_units: "",
    latitude: null,
    longitude: null,
  });

  // Room form data
  const [roomData, setRoomData] = useState({
    room_number: "",
    room_type: "",
    floor: "",
    area: "",
    rent: "",
    management_fee: "",
    deposit: "",
    key_money: "",
    direction: "",
    parking_fee: "",
    available_date: "",
    pets_allowed: false,
    guarantor_required: true,
    two_person_allowed: false,
    facilities: "",
    description: "",
  });

  // Facility data
  const [facilityCodes, setFacilityCodes] = useState([]);
  const [normalizedFacilities, setNormalizedFacilities] = useState([]);
  const [unmatchedFacilities, setUnmatchedFacilities] = useState([]);

  // Process initial location from map
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      reverseGeocode(initialLocation.lat, initialLocation.lng)
        .then(address => {
          setBuildingData(prev => ({
            ...prev,
            address,
            latitude: initialLocation.lat,
            longitude: initialLocation.lng,
          }));
        })
        .catch(err => {
          console.error('住所取得エラー:', err);
          setBuildingData(prev => ({
            ...prev,
            latitude: initialLocation.lat,
            longitude: initialLocation.lng,
          }));
        });
    }
  }, [initialLocation]);

  // Reset when modal closes (but not when closing for map pick)
  useEffect(() => {
    if (!isOpen) {
      if (mapPickingRef.current) return;
      setActiveStep(0);
      setPdfFile(null);
      setAnalyzed(false);
      setExtractedData(null);
      setSimilarBuildings([]);
      setSelectedBuilding(null);
      setError("");
      setBuildingData({
        name: "",
        address: "",
        building_type: "mansion",
        structure: "",
        floors: "",
        built_date: "",
        total_units: "",
        latitude: null,
        longitude: null,
      });
      setRoomData({
        room_number: "",
        room_type: "",
        floor: "",
        area: "",
        rent: "",
        management_fee: "",
        deposit: "",
        key_money: "",
        direction: "",
        parking_fee: "",
        available_date: "",
        pets_allowed: false,
        guarantor_required: true,
        two_person_allowed: false,
        facilities: "",
        description: "",
      });
      setFacilityCodes([]);
      setNormalizedFacilities([]);
      setUnmatchedFacilities([]);
    } else {
      mapPickingRef.current = false;
    }
  }, [isOpen]);

  // Reverse geocode
  const reverseGeocode = (lat, lng) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps API is not loaded'));
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address.replace(/^日本、\s*/, '');
          resolve(address);
        } else {
          reject(new Error('住所の取得に失敗しました'));
        }
      });
    });
  };

  // Geocode address
  const geocodeAddress = useCallback((address) => {
    return new Promise((resolve) => {
      if (!address || !window.google || !window.google.maps) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({ latitude: location.lat(), longitude: location.lng() });
        } else {
          resolve({ latitude: null, longitude: null });
        }
      });
    });
  }, []);

  // Analyze floorplan with AI
  const handleAnalyze = async () => {
    if (!pdfFile) return;

    setAnalyzing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const response = await fetch('/api/v1/buildings/analyze_floorplan', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setExtractedData(data.extracted_data);

        // Apply building data
        if (data.extracted_data.building) {
          const b = data.extracted_data.building;
          setBuildingData(prev => ({
            ...prev,
            name: b.name || prev.name,
            address: b.address || prev.address,
            building_type: b.building_type || prev.building_type,
            structure: b.structure || prev.structure,
            floors: b.floors || prev.floors,
            built_date: b.built_date || prev.built_date,
            total_units: b.total_units || prev.total_units,
          }));

          // Geocode the address
          if (b.address && !buildingData.latitude) {
            const coords = await geocodeAddress(b.address);
            setBuildingData(prev => ({
              ...prev,
              latitude: coords.latitude,
              longitude: coords.longitude,
            }));
          }
        }

        // Apply room data
        if (data.extracted_data.room) {
          const r = data.extracted_data.room;
          setRoomData(prev => ({
            ...prev,
            room_number: r.room_number || prev.room_number,
            room_type: r.room_type || prev.room_type,
            floor: r.floor || prev.floor,
            area: r.area || prev.area,
            rent: r.rent || prev.rent,
            management_fee: r.management_fee ?? prev.management_fee,
            deposit: r.deposit || prev.deposit,
            key_money: r.key_money || prev.key_money,
            direction: r.direction || prev.direction,
            parking_fee: r.parking_fee ?? prev.parking_fee,
            available_date: r.available_date || prev.available_date,
            pets_allowed: r.pets_allowed ?? prev.pets_allowed,
            guarantor_required: r.guarantor_required ?? prev.guarantor_required,
            two_person_allowed: r.two_person_allowed ?? prev.two_person_allowed,
            facilities: r.facilities || prev.facilities,
            description: r.description || prev.description,
          }));

          // Apply facility data
          if (r.facility_codes) setFacilityCodes(r.facility_codes);
          if (r.normalized_facilities) setNormalizedFacilities(r.normalized_facilities);
          if (r.unmatched_facilities) setUnmatchedFacilities(r.unmatched_facilities);
        }

        setAnalyzed(true);
        setActiveStep(1); // Move to building info step
      } else {
        setError(data.error || '解析に失敗しました');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setAnalyzing(false);
    }
  };

  // Find similar buildings
  const findSimilarBuildings = useCallback(async () => {
    if (!buildingData.name && !buildingData.address) return;

    setLoadingSimilar(true);
    try {
      const response = await fetch('/api/v1/buildings/find_similar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: buildingData.name,
          address: buildingData.address,
          latitude: buildingData.latitude,
          longitude: buildingData.longitude,
        }),
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setSimilarBuildings(data.similar_buildings || []);
        // Auto-select if score >= 80
        const bestMatch = data.similar_buildings?.find(b => b.score >= 80);
        if (bestMatch) {
          setSelectedBuilding(bestMatch);
        }
      }
    } catch (err) {
      console.error('Find similar error:', err);
    } finally {
      setLoadingSimilar(false);
    }
  }, [buildingData.name, buildingData.address, buildingData.latitude, buildingData.longitude]);

  // Call findSimilar when moving to step 1
  useEffect(() => {
    if (activeStep === 1 && (buildingData.name || buildingData.address)) {
      findSimilarBuildings();
    }
  }, [activeStep, findSimilarBuildings]);

  // Handle next step
  const handleNext = () => {
    if (activeStep === 0 && !analyzed && pdfFile) {
      // If PDF uploaded but not analyzed, analyze first
      handleAnalyze();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle skip (manual entry)
  const handleSkip = () => {
    setAnalyzed(false);
    setActiveStep(1);
  };

  // Handle back
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle submit
  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      // Get coordinates if not set
      let latitude = buildingData.latitude;
      let longitude = buildingData.longitude;
      if (!latitude || !longitude) {
        const coords = await geocodeAddress(buildingData.address);
        latitude = coords.latitude;
        longitude = coords.longitude;
      }

      const formData = new FormData();

      // Building data
      if (selectedBuilding) {
        formData.append('building[id]', selectedBuilding.id);
      } else {
        formData.append('building[name]', buildingData.name);
        formData.append('building[address]', buildingData.address);
        formData.append('building[building_type]', buildingData.building_type);
        formData.append('building[structure]', buildingData.structure || '');
        formData.append('building[floors]', buildingData.floors || '');
        formData.append('building[built_date]', buildingData.built_date || '');
        formData.append('building[total_units]', buildingData.total_units || '');
        if (latitude) formData.append('building[latitude]', latitude);
        if (longitude) formData.append('building[longitude]', longitude);
      }

      // Room data
      formData.append('room[room_number]', roomData.room_number || '未設定');
      formData.append('room[floor]', roomData.floor || '1');
      formData.append('room[room_type]', roomData.room_type || '');
      formData.append('room[area]', roomData.area || '');
      formData.append('room[rent]', roomData.rent || '');
      formData.append('room[management_fee]', roomData.management_fee || '');
      formData.append('room[deposit]', roomData.deposit || '');
      formData.append('room[key_money]', roomData.key_money || '');
      formData.append('room[direction]', roomData.direction || '');
      formData.append('room[parking_fee]', roomData.parking_fee || '');
      formData.append('room[available_date]', roomData.available_date || '');
      formData.append('room[pets_allowed]', roomData.pets_allowed);
      formData.append('room[guarantor_required]', roomData.guarantor_required);
      formData.append('room[two_person_allowed]', roomData.two_person_allowed);
      formData.append('room[facilities]', roomData.facilities || '');
      formData.append('room[description]', roomData.description || '');

      // Facility codes
      facilityCodes.forEach(code => {
        formData.append('facility_codes[]', code);
      });

      // PDF file
      if (pdfFile) {
        formData.append('file', pdfFile);
      }

      const response = await fetch('/api/v1/buildings/register_from_floorplan', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        if (onSuccess) {
          onSuccess(data.building);
        }
        onClose();
      } else {
        setError(data.errors?.join(', ') || '登録に失敗しました');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting && !analyzing) {
      onClose();
    }
  };

  // Validation for each step
  const canProceed = () => {
    switch (activeStep) {
      case 0: // Upload step
        return true; // Can always proceed (skip or analyze)
      case 1: // Building info
        return buildingData.name && buildingData.address;
      case 2: // Room info
        return true; // All room fields are optional
      case 3: // Confirmation
        return true;
      default:
        return false;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <FloorplanUploadStep
            pdfFile={pdfFile}
            onFileChange={setPdfFile}
            analyzing={analyzing}
            analyzed={analyzed}
            onAnalyze={handleAnalyze}
            onSkip={handleSkip}
            error={error}
          />
        );
      case 1:
        return (
          <Box>
            {similarBuildings.length > 0 && (
              <SimilarBuildingSelector
                buildings={similarBuildings}
                selected={selectedBuilding}
                onSelect={setSelectedBuilding}
                loading={loadingSimilar}
              />
            )}
            <BuildingInfoStep
              data={buildingData}
              onChange={setBuildingData}
              disabled={!!selectedBuilding}
              onStartMapPick={() => {
                mapPickingRef.current = true;
                onClose();
                onStartMapPick && onStartMapPick();
              }}
            />
          </Box>
        );
      case 2:
        return (
          <RoomInfoStep
            data={roomData}
            onChange={setRoomData}
            facilityCodes={facilityCodes}
            normalizedFacilities={normalizedFacilities}
            unmatchedFacilities={unmatchedFacilities}
            onFacilityCodesChange={setFacilityCodes}
          />
        );
      case 3:
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              登録内容の確認
            </Typography>

            {/* Building Summary */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                {selectedBuilding ? '既存建物に追加' : '新規建物'}
              </Typography>
              <Typography variant="body2">
                <strong>建物名:</strong> {selectedBuilding?.name || buildingData.name}
              </Typography>
              <Typography variant="body2">
                <strong>住所:</strong> {selectedBuilding?.address || buildingData.address}
              </Typography>
              {!selectedBuilding && buildingData.structure && (
                <Typography variant="body2">
                  <strong>構造:</strong> {buildingData.structure}
                </Typography>
              )}
            </Box>

            {/* Room Summary */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="secondary" sx={{ mb: 1 }}>
                新規部屋
              </Typography>
              <Typography variant="body2">
                <strong>部屋番号:</strong> {roomData.room_number || '未設定'}
              </Typography>
              {roomData.room_type && (
                <Typography variant="body2">
                  <strong>間取り:</strong> {roomData.room_type}
                </Typography>
              )}
              {roomData.rent && (
                <Typography variant="body2">
                  <strong>賃料:</strong> {Number(roomData.rent).toLocaleString()}円
                </Typography>
              )}
              {roomData.area && (
                <Typography variant="body2">
                  <strong>面積:</strong> {roomData.area}m²
                </Typography>
              )}
              {pdfFile && (
                <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                  募集図面: {pdfFile.name}
                </Typography>
              )}
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100%' : '90vh',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white',
          px: 2,
          py: 1,
          minHeight: '48px',
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          物件新規登録
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={submitting || analyzing}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        {error && activeStep !== 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, borderTop: 1, borderColor: 'divider' }}>
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={submitting || analyzing}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 'auto' }}
          >
            戻る
          </Button>
        )}

        {activeStep === 0 && (
          <Button
            onClick={handleSkip}
            disabled={analyzing}
            variant="outlined"
          >
            スキップして手入力
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || analyzing}
            variant="contained"
            endIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
          >
            {activeStep === 0 && pdfFile && !analyzed ? 'AI解析して次へ' : '次へ'}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
            variant="contained"
            color="primary"
          >
            {submitting ? <CircularProgress size={24} /> : '登録する'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
