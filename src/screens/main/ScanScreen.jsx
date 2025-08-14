import React, { useState } from 'react'
import { Scan, Smartphone, Mic, Thermometer, Moon, CheckCircle } from 'lucide-react'
import Button from '../../components/common/Button'

const ScanScreen = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)

  const handleStartScan = () => {
    setIsScanning(true)
    
    // Simulate scanning process
    setTimeout(() => {
      setScanResults({
        noiseLevel: Math.floor(Math.random() * 40) + 20, // 20-60 dB
        lightLevel: Math.floor(Math.random() * 30) + 5,  // 5-35 lux
        temperature: Math.floor(Math.random() * 8) + 18, // 18-26°C
        phonePosition: 'Optimal',
        recommendation: 'Good sleep environment detected'
      })
      setIsScanning(false)
    }, 3000)
  }

  const resetScan = () => {
    setScanResults(null)
  }

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 fade-in">
      <div className="max-w-md mx-auto h-full flex flex-col">
        <h1 className="text-2xl font-medium text-center mb-8">Smart Sleep Scan</h1>
        
        {!isScanning && !scanResults && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-blue-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Scan className="w-12 h-12 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold mb-4">Analyze Your Sleep Environment</h2>
              <p className="text-gray-400 leading-relaxed">
                Our smart scan will analyze your sleep environment using device sensors to provide 
                personalized recommendations for better sleep quality.
              </p>
            </div>

            <div className="space-y-4 mb-12">
              <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-xl">
                <Mic className="w-5 h-5 text-green-400" />
                <span className="text-sm">Ambient noise level detection</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-xl">
                <Moon className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Light environment analysis</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-xl">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <span className="text-sm">Device position optimization</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-xl">
                <Thermometer className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">Temperature comfort assessment</span>
              </div>
            </div>

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
            <p className="text-gray-400 text-center">
              Please keep your device still while we analyze your sleep environment
            </p>
            <div className="mt-8 space-y-2 text-sm text-gray-500">
              <p>• Measuring ambient noise levels</p>
              <p>• Detecting light conditions</p>
              <p>• Analyzing device position</p>
              <p>• Generating recommendations</p>
            </div>
          </div>
        )}

        {scanResults && (
          <div className="flex-1">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Scan Complete</h2>
              <p className="text-gray-400">{scanResults.recommendation}</p>
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
                  {scanResults.noiseLevel < 30 ? 'Excellent - Very quiet' : 
                   scanResults.noiseLevel < 45 ? 'Good - Minimal noise' : 'Consider noise reduction'}
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
                  {scanResults.lightLevel < 10 ? 'Perfect - Very dark' : 
                   scanResults.lightLevel < 25 ? 'Good - Dim lighting' : 'Consider blackout curtains'}
                </p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Thermometer className="w-5 h-5 text-yellow-400 mr-2" />
                    <span className="font-medium">Temperature</span>
                  </div>
                  <span className="text-yellow-400 font-semibold">{scanResults.temperature}°C</span>
                </div>
                <p className="text-sm text-gray-400">
                  {scanResults.temperature >= 18 && scanResults.temperature <= 22 ? 
                   'Ideal for sleep' : 'Consider adjusting room temperature'}
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
                  Place on nightstand for best tracking accuracy
                </p>
              </div>
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