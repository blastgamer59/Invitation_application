import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, QrCode, Phone, Users, CheckCircle, AlertCircle, Camera, 
  User, Utensils, Hash, Loader2 
} from 'lucide-react';

const StaffPanel = () => {
  // State
  const [verificationMethod, setVerificationMethod] = useState('code');
  const [inputValue, setInputValue] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // API Configuration (Local Development)
  const API_BASE_URL = 'http://localhost:5000';

  // Load jsQR dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Handle camera cleanup
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Initialize camera
  const initCamera = async () => {
    try {
      const constraints = selectedCamera 
        ? { video: { deviceId: { exact: selectedCamera } } }
        : { video: { facingMode: 'environment' } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
      
      if (!selectedCamera && videoDevices.length > 0) {
        const backCamera = videoDevices.find(d => d.label.includes('back'));
        setSelectedCamera(backCamera?.deviceId || videoDevices[0].deviceId);
      }
      
      return stream;
    } catch (err) {
      setCameraError('Camera access denied. Please enable permissions.');
      console.error('Camera error:', err);
      return null;
    }
  };

  // Start QR Scanner
  const startScanner = async () => {
    setLoading(true);
    setCameraError('');
    setIsScanning(true);

    try {
      const stream = await initCamera();
      if (!stream) return;

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR && window.jsQR(
          imageData.data, 
          imageData.width, 
          imageData.height
        );

        if (code) {
          handleScan(code.data);
          stopScanner();
        } else {
          requestAnimationFrame(scanFrame);
        }
      };

      scanFrame();
    } catch (err) {
      console.error('Scanner error:', err);
      setCameraError('Failed to start scanner');
      stopScanner();
    } finally {
      setLoading(false);
    }
  };

  // Stop scanner
  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Handle QR code scan
  const handleScan = async (data) => {
    try {
      // Verify the user using the scanned QR code data
      await verifyUser('qr', data);
    } catch (err) {
      setError('Invalid QR code. Please try again.');
      console.error('QR scan error:', err);
    }
  };

  // Verify user
  const verifyUser = async (method, value) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setUserInfo(null);

    try {
      let endpoint;
      
      if (method === 'qr') {
        // Parse QR code data (assuming it contains confirmationNumber)
        let qrData;
        try {
          qrData = JSON.parse(value);
        } catch (e) {
          throw new Error('Invalid QR code format');
        }

        if (!qrData.confirmationNumber) {
          throw new Error('QR code does not contain confirmation number');
        }

        endpoint = `${API_BASE_URL}/api/rsvp/${qrData.confirmationNumber}`;
      } else if (method === 'phone') {
        endpoint = `${API_BASE_URL}/api/rsvp?phoneNumber=${encodeURIComponent(value)}`;
      } else {
        endpoint = `${API_BASE_URL}/api/rsvp/${value}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Verification failed');

      setUserInfo(data.rsvp || data); // Handle both response formats
      setSuccess('User verified successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance
  const markAttendance = async () => {
    if (!userInfo?._id) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/rsvp/${userInfo._id}/attended`, {
        method: 'PATCH'
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark attendance');
      
      setSuccess('Attendance marked successfully!');
      setUserInfo(prev => ({ 
        ...prev, 
        attended: true,
        attendedAt: new Date().toISOString() 
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError('Please enter a value');
      return;
    }
    verifyUser(verificationMethod, inputValue.trim());
  };

  // Reset form
  const resetForm = () => {
    setInputValue('');
    setUserInfo(null);
    setError('');
    setSuccess('');
    stopScanner();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Staff Check-In Panel</h1>
          </div>
          <p className="text-gray-600">Verify and manage event attendees</p>
        </div>

        {/* Verification Method Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Verification Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => { setVerificationMethod('code'); resetForm(); }}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                verificationMethod === 'code' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Hash className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Verification Code</div>
                <div className="text-sm text-gray-500">4-digit code</div>
              </div>
            </button>

            <button
              onClick={() => { setVerificationMethod('phone'); resetForm(); }}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                verificationMethod === 'phone' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Phone className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Phone Number</div>
                <div className="text-sm text-gray-500">Manual entry</div>
              </div>
            </button>

            <button
              onClick={() => { setVerificationMethod('qr'); resetForm(); }}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                verificationMethod === 'qr' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <QrCode className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">QR Code</div>
                <div className="text-sm text-gray-500">Scan QR</div>
              </div>
            </button>
          </div>

          {/* QR Scanner Section */}
          {verificationMethod === 'qr' && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <button
                  onClick={isScanning ? stopScanner : startScanner}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    isScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white disabled:bg-gray-400`}
                >
                  <Camera className="w-5 h-5" />
                  {isScanning ? 'Stop Scanner' : 'Start QR Scanner'}
                </button>

                {cameras.length > 1 && (
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    disabled={isScanning}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {cameras.map(camera => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {loading && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg mb-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isScanning ? 'Starting camera...' : 'Processing...'}</span>
                </div>
              )}

              {cameraError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {isScanning && (
                <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                  <video 
                    ref={videoRef} 
                    className="w-full h-auto max-h-[60vh] object-contain"
                    autoPlay
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {!isScanning && verificationMethod === 'qr' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-800 mb-2">QR Scanning Instructions:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Click "Start QR Scanner" button</li>
                    <li>• Allow camera permissions when prompted</li>
                    <li>• Point camera at the attendee's QR code</li>
                    <li>• Scanning happens automatically</li>
                  </ul>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">Or enter code manually:</p>
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter verification code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg disabled:bg-gray-400"
                  >
                    <Search className="w-5 h-5" />
                    Verify
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Code/Phone Input Section */}
          {verificationMethod !== 'qr' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {verificationMethod === 'code' ? 'Verification Code' : 'Phone Number'}
                </label>
                <div className="flex gap-3">
                  <input
                    type={verificationMethod === 'phone' ? 'tel' : 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={verificationMethod === 'code' ? '1234' : '5551234567'}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    maxLength={verificationMethod === 'code' ? 4 : 15}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg disabled:bg-gray-400"
                  >
                    <Search className="w-5 h-5" />
                    Verify
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mt-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg mt-4">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* User Information */}
        {userInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Attendee Information
            </h2>

            {/* QR Code Display */}
            {userInfo.qrCodeDataUrl && (
              <div className="mb-6 text-center">
                <div className="inline-block bg-white p-2 rounded-lg border border-gray-200">
                  <img 
                    src={userInfo.qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Registered QR Code</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold text-gray-800">{userInfo.fullName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-lg text-gray-800">{userInfo.phoneNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Confirmation Code</label>
                  <p className="text-lg font-mono text-blue-600">{userInfo.confirmationNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Registration Date</label>
                  <p className="text-lg text-gray-800">
                    {new Date(userInfo.createdAt).toLocaleDateString()} at{' '}
                    {new Date(userInfo.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Attendance Status</label>
                  <span className={`inline-block px-2 py-1 rounded-md text-sm font-medium ${
                    userInfo.attending === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {userInfo.attending === 'Yes' ? 'Confirmed' : 'Not Attending'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Utensils className="w-4 h-4" />
                    Meal Preferences
                  </label>
                  <p className="text-lg text-gray-800">
                    {Array.isArray(userInfo.mealPreferences) 
                      ? userInfo.mealPreferences.join(', ') 
                      : userInfo.mealPreferences || 'None specified'}
                  </p>
                </div>

                {userInfo.familyCount > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Family Members</label>
                    <p className="text-lg text-gray-800">
                      {userInfo.familyCount} {userInfo.familyCount === 1 ? 'person' : 'people'}
                      {userInfo.familyMembers?.length > 0 && (
                        <span className="block text-sm text-gray-600 mt-1">
                          {userInfo.familyMembers.join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Action */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Check-In Status</h3>
                  <p className={`text-sm ${
                    userInfo.attended ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {userInfo.attended
                      ? `Checked in at ${new Date(userInfo.attendedAt).toLocaleTimeString()}`
                      : 'Not checked in yet'}
                  </p>
                </div>

                {!userInfo.attended && userInfo.attending === 'Yes' && (
                  <button
                    onClick={markAttendance}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg disabled:bg-gray-400"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Check In
                  </button>
                )}

                {userInfo.attended && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span>Already Checked In</span>
                  </div>
                )}

                {userInfo.attending !== 'Yes' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span>Not Attending</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reset Button */}
            <div className="border-t pt-4 mt-4">
              <button
                onClick={resetForm}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Verify Another Attendee
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPanel;