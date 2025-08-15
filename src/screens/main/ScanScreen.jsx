import React, { useState, useEffect } from 'react'
import { Scan, Smartphone, Mic, Thermometer, Moon, CheckCircle, AlertTriangle, Zap, Shield, RefreshCw } from 'lucide-react'
import Button from '../../components/common/Button'

const ScanScreen = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [sensorPermissions, setSensorPermissions] = useState({
    motion: 'checking',
    microphone: 'checking',
    ambient: 'checking'
  })
  const [realTimeData, setRealTimeData] = useState({
    motion: 0,
    audio: 0,
    orientation: null
  })
  const [permissionErrors, setPermissionErrors] = useState([])

  // Check sensor availability and permissions
  useEffect(() => {
    checkSensorSupport()
  }, [])

  const checkSensorSupport = async () => {
    const permissions = {
      motion: 'denied',
      microphone: 'denied',
      ambient: 'unavailable'
    }
    const errors = []

    // Check Device Motion API
    if (typeof DeviceMotionEvent !== 'undefined') {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ - requires explicit permission
        try {
          const permission = await DeviceMotionEvent.requestPermission()
          permissions.motion = permission === 'granted' ? 'granted' : 'denied'
          if (permission !== 'granted') {
            errors.push('Motion sensors require permission on iOS. Tap Settings to enable.')
          }
        } catch (error) {
          permissions.motion = 'denied'
          errors.push('Motion sensor permission was denied.')
        }
      } else {
        // Android/Desktop - usually available without explicit permission
        permissions.motion = 'granted'
      }
    } else {
      errors.push('Motion sensors are not supported on this device.')
    }

    // Check Microphone
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      permissions.microphone = 'available' // Will ask when needed
    } else {
      errors.push('Microphone is not supported on this browser.')
    }

    // Light sensor (limited support)
    permissions.ambient = 'estimated'

    setSensorPermissions(permissions)
    setPermissionErrors(errors)
  }

  // Request microphone permission explicitly
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        }
      })
      
      // Permission granted - stop the stream immediately
      stream.getTracks().forEach(track => track.stop())
      
      setSensorPermissions(prev => ({ ...prev, microphone: 'granted' }))
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setSensorPermissions(prev => ({ ...prev, microphone: 'denied' }))
      return false
    }
  }

  // Request motion permission for iOS
  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission()
        setSensorPermissions(prev => ({ 
          ...prev, 
          motion: permission === 'granted' ? 'granted' : 'denied' 
        }))
        return permission === 'granted'
      } catch (error) {
        setSensorPermissions(prev => ({ ...prev, motion: 'denied' }))
        return false
      }
    }
    return true // Already available
  }

  // Real-time motion monitoring
  const startMotionMonitoring = () => {
    if (sensorPermissions.motion !== 'granted') return null

    const handleMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity
      if (acceleration) {
        const totalMotion = Math.sqrt(
          (acceleration.x || 0) ** 2 + 
          (acceleration.y || 0) ** 2 + 
          (acceleration.z || 0) ** 2
        )
        setRealTimeData(prev => ({ ...prev, motion: totalMotion }))
      }
    }

    const handleOrientation = (event) => {
      setRealTimeData(prev => ({ 
        ...prev, 
        orientation: {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        }
      }))
    }

    window.addEventListener('devicemotion', handleMotion)
    window.addEventListener('deviceorientationabsolute', handleOrientation)
    
    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      window.removeEventListener('deviceorientationabsolute', handleOrientation)
    }
  }

  // Ambient noise monitoring using microphone
  const measureAmbientNoise = async () => {
    // First request permission if not already granted
    if (sensorPermissions.microphone !== 'granted') {
      const granted = await requestMicrophonePermission()
      if (!granted) return null
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        }
      })

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 512
      microphone.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      return new Promise((resolve) => {
        let sampleCount = 0
        let totalLevel = 0

        const measureNoise = () => {
          analyser.getByteFrequencyData(dataArray)
          
          // Calculate RMS (Root Mean Square) for better accuracy
          const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length)
          
          // Convert to approximate dB
          const decibels = Math.max(20 * Math.log10(rms / 255) + 60, 0)
          
          totalLevel += decibels
          sampleCount++
          
          setRealTimeData(prev => ({ ...prev, audio: decibels }))
          
          if (sampleCount >= 15) { // Sample for ~3 seconds
            const averageDb = totalLevel / sampleCount
            stream.getTracks().forEach(track => track.stop())
            audioContext.close()
            resolve(averageDb)
          } else {
            setTimeout(measureNoise, 200)
          }
        }
        
        measureNoise()
      })
    } catch (error) {
      console.error('Microphone access failed:', error)
      return null
    }
  }

  // Comprehensive environment scan
  const handleStartScan = async () => {
    setIsScanning(true)
    setScanResults(null)
    
    // Request permissions first
    let motionAvailable = sensorPermissions.motion === 'granted'
    if (!motionAvailable && typeof DeviceMotionEvent.requestPermission === 'function') {
      motionAvailable = await requestMotionPermission()
    }

    // Start motion monitoring if available
    const cleanupMotion = motionAvailable ? startMotionMonitoring() : null
    
    try {
      // Measure ambient noise
      const noiseLevel = await measureAmbientNoise()
      
      // Collect motion data for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Stop motion monitoring
      if (cleanupMotion) cleanupMotion()
      
      // Analyze collected data
      const results = {
        noiseLevel: noiseLevel !== null ? Math.round(noiseLevel) : estimateNoiseLevel(),
        lightLevel: estimateLightLevel(),
        motion: realTimeData.motion,
        phonePosition: analyzePhonePosition(),
        recommendation: generateRecommendation(),
        sensorData: {
          motionDetected: motionAvailable && realTimeData.motion > 0,
          orientationSupported: realTimeData.orientation !== null,
          microphoneUsed: noiseLevel !== null,
          estimatedValues: !motionAvailable || noiseLevel === null
        }
      }
      
      setScanResults(results)
    } catch (error) {
      console.error('Scan error:', error)
      // Fallback to estimated data
      setScanResults({
        noiseLevel: estimateNoiseLevel(),
        lightLevel: estimateLightLevel(),
        motion: realTimeData.motion || 0,
        phonePosition: 'Unknown',
        recommendation: 'Scan completed with estimated values due to limited sensor access',
        sensorData: {
          motionDetected: false,
          orientationSupported: false,
          microphoneUsed: false,
          estimatedValues: true
        }
      })
    } finally {
      setIsScanning(false)
    }
  }

  // Estimate noise level based on time and environment
  const estimateNoiseLevel = () => {
    const hour = new Date().getHours()
    // Night time is generally quieter
    if (hour >= 22 || hour <= 6) return Math.floor(Math.random() * 15) + 25  // 25-40 dB
    if (hour >= 7 && hour <= 9) return Math.floor(Math.random() * 20) + 40   // 40-60 dB (morning)
    if (hour >= 10 && hour <= 17) return Math.floor(Math.random() * 25) + 45 // 45-70 dB (day)
    return Math.floor(Math.random() * 20) + 35 // 35-55 dB (evening)
  }

  // Estimate light level based on time of day
  const estimateLightLevel = () => {
    const hour = new Date().getHours()
    if (hour >= 22 || hour <= 6) return Math.floor(Math.random() * 5) + 2    // Very dark
    if (hour >= 7 && hour <= 8) return Math.floor(Math.random() * 30) + 20   // Dawn
    if (hour >= 9 && hour <= 17) return Math.floor(Math.random() * 100) + 200 // Bright
    return Math.floor(Math.random() * 40) + 30 // Dusk
  }

  // Analyze phone position based on orientation
  const analyzePhonePosition = () => {
    if (!realTimeData.orientation) return 'Place flat on nightstand'
    
    const { beta, gamma } = realTimeData.orientation
    
    if (Math.abs(beta) < 15 && Math.abs(gamma) < 15) return 'Flat (Perfect)'
    if (Math.abs(beta) > 45) return 'Too tilted'
    return 'Slightly angled'
  }

  // Generate smart recommendations
  const generateRecommendation = () => {
    const noise = scanResults?.noiseLevel || realTimeData.audio || estimateNoiseLevel()
    const light = scanResults?.lightLevel || estimateLightLevel()
    const motion = realTimeData.motion || 0
    
    if (noise < 35 && light < 20 && motion < 2) return 'Excellent sleep environment detected!'
    if (noise < 50 && light < 50) return 'Good environment - minor adjustments recommended'
    if (noise > 60) return 'Consider reducing noise levels for better sleep'
    if (light > 100) return 'Room is too bright - consider blackout curtains'
    return 'Environment scan completed - see details below'
  }

  const resetScan = () => {
    setScanResults(null)
    setRealTimeData({ motion: 0, audio: 0, orientation: null })
  }

  // Permission status component with action buttons
  const PermissionStatus = () => (
    <div className="bg-gray-800 rounded-xl p-4 mb-6">
      <h3 className="font-semibold mb-3 flex items-center">
        <Shield className="w-4 h-4 mr-2 text-yellow-400" />
        Sensor Access
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Motion Sensor:</span>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${
              sensorPermissions.motion === 'granted' ? 'bg-green-900/30 text-green-400' : 
              sensorPermissions.motion === 'checking' ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-red-900/30 text-red-400'
            }`}>
              {sensorPermissions.motion === 'granted' ? 'Allowed' : 
               sensorPermissions.motion === 'checking' ? 'Checking...' : 'Denied'}
            </span>
            {sensorPermissions.motion === 'denied' && typeof DeviceMotionEvent.requestPermission === 'function' && (
              <button
                onClick={requestMotionPermission}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
              >
                Request
              </button>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm">Microphone:</span>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded ${
              sensorPermissions.microphone === 'granted' ? 'bg-green-900/30 text-green-400' : 
              sensorPermissions.microphone === 'available' ? 'bg-yellow-900/30 text-yellow-400' :
              sensorPermissions.microphone === 'checking' ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-red-900/30 text-red-400'
            }`}>
              {sensorPermissions.microphone === 'granted' ? 'Allowed' : 
               sensorPermissions.microphone === 'available' ? 'Available' :
               sensorPermissions.microphone === 'checking' ? 'Checking...' : 'Denied'}
            </span>
            {sensorPermissions.microphone === 'available' && (
              <button
                onClick={requestMicrophonePermission}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
              >
                Allow
              </button>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm">Light Level:</span>
          <span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400">
            Time-based
          </span>
        </div>
      </div>
      
      {permissionErrors.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-400 mb-2">Tips:</h4>
          <ul className="text-xs text-yellow-300 space-y-1">
            <li>• Use HTTPS for sensor access</li>
            <li>• Allow permissions when prompted</li>
            <li>• Scan will work with available sensors</li>
            <li>• Results may be estimated if sensors unavailable</li>
          </ul>
        </div>
      )}
    </div>
  )

  // Real-time monitoring display
  const RealTimeMonitor = () => (
    <div className="bg-gray-800 rounded-xl p-4 mb-6">
      <h3 className="font-semibold mb-3">Live Monitoring</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Motion Level:</span>
          <span className="font-mono">{realTimeData.motion.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Audio Level:</span>
          <span className="font-mono">{realTimeData.audio.toFixed(1)} dB</span>
        </div>
        <div className="flex justify-between">
          <span>Phone Position:</span>
          <span>{analyzePhonePosition()}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 fade-in">
      <div className="max-w-md mx-auto h-full flex flex-col">
        <h1 className="text-2xl font-medium text-center mb-8">Sleep Environment Scan</h1>
        
        {!isScanning && !scanResults && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-blue-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Scan className="w-12 h-12 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold mb-4">Analyze Your Sleep Environment</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Scan your environment using available device sensors and get personalized sleep recommendations.
              </p>
            </div>

            <PermissionStatus />
            
            {(realTimeData.motion > 0 || realTimeData.audio > 0) && <RealTimeMonitor />}

            <Button
              onClick={handleStartScan}
              className="w-full"
              size="lg"
            >
              Start Environment Scan
            </Button>
          </div>
        )}

        {isScanning && (
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-32 h-32 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
            <h2 className="text-xl font-semibold mb-4">Scanning Environment...</h2>
            <p className="text-gray-400 text-center mb-6">
              Analyzing your sleep environment using available sensors
            </p>
            {(realTimeData.motion > 0 || realTimeData.audio > 0) && <RealTimeMonitor />}
            <div className="space-y-2 text-sm text-gray-500">
              <p>• {sensorPermissions.motion === 'granted' ? 'Reading motion sensors...' : 'Using motion estimation...'}</p>
              <p>• {sensorPermissions.microphone === 'granted' ? 'Measuring ambient noise...' : 'Estimating noise levels...'}</p>
              <p>• Analyzing environment conditions...</p>
              <p>• Generating recommendations...</p>
            </div>
          </div>
        )}

        {scanResults && (
          <div className="flex-1">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Scan Complete</h2>
              <p className="text-gray-400">{scanResults.recommendation}</p>
              
              {/* Sensor usage indicators */}
              <div className="flex justify-center space-x-2 mt-4 text-xs flex-wrap">
                {scanResults.sensorData.motionDetected && (
                  <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded mb-1">Motion Sensor</span>
                )}
                {scanResults.sensorData.microphoneUsed && (
                  <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded mb-1">Microphone</span>
                )}
                {scanResults.sensorData.estimatedValues && (
                  <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded mb-1">Estimated Data</span>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Mic className="w-5 h-5 text-green-400 mr-2" />
                    <span className="font-medium">Noise Level</span>
                  </div>
                  <span className="text-green-400 font-semibold">{scanResults.noiseLevel} dB</span>
                </div>
                <p className="text-sm text-gray-400">
                  {scanResults.noiseLevel < 35 ? 'Excellent - Very quiet' : 
                   scanResults.noiseLevel < 50 ? 'Good - Acceptable noise' : 'Consider noise reduction'}
                </p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Moon className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="font-medium">Light Level</span>
                  </div>
                  <span className="text-blue-400 font-semibold">{scanResults.lightLevel} lux</span>
                </div>
                <p className="text-sm text-gray-400">
                  {scanResults.lightLevel < 20 ? 'Perfect - Very dark' : 
                   scanResults.lightLevel < 100 ? 'Good - Dim lighting' : 'Too bright for optimal sleep'}
                </p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="font-medium">Device Position</span>
                  </div>
                  <span className="text-purple-400 font-semibold">{scanResults.phonePosition}</span>
                </div>
                <p className="text-sm text-gray-400">
                  {scanResults.phonePosition.includes('Perfect') || scanResults.phonePosition.includes('Flat') ? 
                   'Optimal placement for tracking' : 'Consider placing flat on nightstand'}
                </p>
              </div>

              {scanResults.motion > 0 && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                      <span className="font-medium">Current Movement</span>
                    </div>
                    <span className="text-yellow-400 font-semibold">
                      {Math.round(scanResults.motion * 10) / 10}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Stability level - keep device still for accurate tracking
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={resetScan}
              variant="secondary"
              className="w-full"
            >
              Scan Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScanScreen