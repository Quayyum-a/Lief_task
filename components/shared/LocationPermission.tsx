"use client";

import { useState } from "react";
import { Card, Button, Alert, Space, Typography, Spin } from "antd";
import {
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useLocation } from "@/hooks/useLocation";

const { Title, Text, Paragraph } = Typography;

interface LocationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showCurrentLocation?: boolean;
  title?: string;
  description?: string;
}

export default function LocationPermission({
  onPermissionGranted,
  onPermissionDenied,
  showCurrentLocation = true,
  title = "Location Access Required",
  description = "This app needs access to your location to verify you're within the designated work area.",
}: LocationPermissionProps) {
  const {
    location,
    error,
    loading,
    permissionState,
    isSupported,
    requestPermission,
    requestLocation,
  } = useLocation() as ReturnType<typeof useLocation> & {
    permissionState: "granted" | "denied" | "prompt" | "unknown";
  };

  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  const handleRequestPermission = async () => {
    // Only request if permission hasn't been granted or denied
    if (permissionState === "granted" || permissionState === "denied") {
      return;
    }

    setHasRequestedPermission(true);
    await requestPermission();

    // Get the latest permission state after requesting permission
    const updatedPermissionState = (navigator.permissions
      ? (await navigator.permissions.query({ name: "geolocation" })).state
      : "unknown") as "granted" | "denied" | "prompt" | "unknown";

    if (updatedPermissionState === "granted") {
      onPermissionGranted?.();
    } else if (updatedPermissionState === "denied") {
      onPermissionDenied?.();
    }
  };

  const handleRetryLocation = async () => {
    await requestLocation();
  };

  // Browser not supported
  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <div className="text-center">
          <ExclamationCircleOutlined className="text-4xl text-red-500 mb-4" />
          <Title level={4} className="text-red-600">
            Location Not Supported
          </Title>
          <Paragraph type="secondary">
            Your browser doesn&apos;t support location services. Please use a
            modern browser that supports geolocation to use this feature.
          </Paragraph>
        </div>
      </Card>
    );
  }

  // Permission granted and location available
  if (permissionState === "granted" && location && showCurrentLocation) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <div className="text-center">
          <CheckCircleOutlined className="text-4xl text-green-500 mb-4" />
          <Title level={4} className="text-green-600">
            Location Access Granted
          </Title>

          <Space direction="vertical" size="middle" className="w-full">
            <div>
              <Text strong>Current Location:</Text>
              <br />
              <Text code className="text-sm">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </div>

            {location.accuracy && (
              <div>
                <Text type="secondary" className="text-sm">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </Text>
              </div>
            )}

            <Button
              icon={<EnvironmentOutlined />}
              onClick={handleRetryLocation}
              loading={loading}
              size="small"
            >
              Refresh Location
            </Button>
          </Space>
        </div>
      </Card>
    );
  }

  // Permission denied
  if (permissionState === "denied") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <Alert
          message="Location Access Denied"
          description={
            <div>
              <Paragraph className="mb-2">
                Location access was denied. To use location-based features:
              </Paragraph>
              <ol className="text-sm text-gray-600 ml-4">
                <li>
                  Click the location icon in your browser&apos;s address bar
                </li>
                <li>Select &quot;Allow&quot; for location access</li>
                <li>Refresh the page</li>
              </ol>
              <Paragraph className="mt-2 mb-0 text-sm">
                Or try the button below to request permission again:
              </Paragraph>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4"
        />

        <div className="text-center">
          <Button
            type="primary"
            icon={<EnvironmentOutlined />}
            onClick={handleRequestPermission}
            loading={loading}
          >
            Request Location Access
          </Button>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <Alert
          message="Location Error"
          description={
            <div>
              <Text>{error.message}</Text>
              {error.type === "TIMEOUT" && (
                <Paragraph className="mt-2 mb-0 text-sm">
                  This might be due to poor GPS signal. Try moving to an area
                  with better reception.
                </Paragraph>
              )}
              {error.type === "POSITION_UNAVAILABLE" && (
                <Paragraph className="mt-2 mb-0 text-sm">
                  Location services might be disabled on your device. Please
                  check your device settings.
                </Paragraph>
              )}
            </div>
          }
          type="error"
          showIcon
          className="mb-4"
        />

        <div className="text-center">
          <Button
            icon={<EnvironmentOutlined />}
            onClick={handleRetryLocation}
            loading={loading}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Initial state - requesting permission
  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center">
        <EnvironmentOutlined className="text-4xl text-blue-500 mb-4" />
        <Title level={4}>{title}</Title>
        <Paragraph type="secondary" className="mb-6">
          {description}
        </Paragraph>

        <Alert
          message="Why do we need location access?"
          description={
            <ul className="text-sm text-left mt-2 ml-4">
              <li>Verify you&apos;re at the correct work location</li>
              <li>Automatically suggest clock in/out times</li>
              <li>Ensure accurate shift tracking</li>
              <li>Provide location-based notifications</li>
            </ul>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          className="mb-6 text-left"
        />

        <Space direction="vertical" size="middle" className="w-full">
          {loading ? (
            <div>
              <Spin />
              <Text className="ml-2">Requesting location access...</Text>
            </div>
          ) : (
            <>
              <Button
                type="primary"
                size="large"
                icon={<EnvironmentOutlined />}
                onClick={handleRequestPermission}
                block
              >
                Enable Location Access
              </Button>

              {hasRequestedPermission && (
                <Text type="secondary" className="text-sm">
                  Please allow location access when prompted by your browser
                </Text>
              )}
            </>
          )}
        </Space>
      </div>
    </Card>
  );
}
