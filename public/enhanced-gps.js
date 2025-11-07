/**
 * Enhanced GPS Tracking Module
 * Provides precise, fast, and reliable location tracking
 * with multiple fallback mechanisms and accuracy improvements
 */

class EnhancedGPS {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.accuracyThreshold = 30; // Target accuracy in meters
        this.timeout = 15000; // 15 seconds
        this.maximumAge = 5000; // 5 seconds cache
        this.retryAttempts = 3;
        this.isTracking = false;
        
        // Geocoding APIs with fallbacks
        this.geocodingAPIs = [
            {
                name: 'Nominatim',
                url: (lat, lng) => `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                parse: (data) => this.parseNominatim(data)
            },
            {
                name: 'OpenCage',
                url: (lat, lng) => `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=free&limit=1`,
                parse: (data) => this.parseOpenCage(data)
            },
            {
                name: 'BigDataCloud',
                url: (lat, lng) => `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
                parse: (data) => this.parseBigDataCloud(data)
            }
        ];
    }

    /**
     * Get current location with high precision
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} Location data with coordinates and address
     */
    async getPreciseLocation(options = {}) {
        const config = {
            timeout: options.timeout || this.timeout,
            accuracyThreshold: options.accuracyThreshold || this.accuracyThreshold,
            enableWatch: options.enableWatch !== false,
            getAddress: options.getAddress !== false,
            showProgress: options.showProgress !== false
        };

        if (!this.isGeolocationSupported()) {
            throw new Error('Geolocation is not supported by your browser');
        }

        if (config.showProgress) {
            this.showProgressUI('🛰️ Acquiring GPS signal...');
        }

        try {
            // Try quick location first
            const quickLocation = await this.getQuickLocation(config);
            
            // If accuracy is good enough, use it immediately
            if (quickLocation && quickLocation.accuracy <= config.accuracyThreshold) {
                console.log('✅ Quick location acquired with good accuracy:', quickLocation);
                if (config.showProgress) {
                    this.updateProgressUI(`✅ High precision location (±${Math.round(quickLocation.accuracy)}m)`);
                }
                
                const result = await this.enrichLocationData(quickLocation, config.getAddress);
                if (config.showProgress) {
                    this.hideProgressUI();
                }
                return result;
            }

            // If not accurate enough and watch is enabled, try precise tracking
            if (config.enableWatch) {
                if (config.showProgress) {
                    this.updateProgressUI('🎯 Improving precision...');
                }
                const preciseLocation = await this.getWatchLocation(config);
                const result = await this.enrichLocationData(preciseLocation, config.getAddress);
                if (config.showProgress) {
                    this.hideProgressUI();
                }
                return result;
            }

            // Otherwise use quick location
            const result = await this.enrichLocationData(quickLocation, config.getAddress);
            if (config.showProgress) {
                this.hideProgressUI();
            }
            return result;

        } catch (error) {
            if (config.showProgress) {
                this.hideProgressUI();
            }
            throw this.handleLocationError(error);
        }
    }

    /**
     * Get quick location (faster but may be less accurate)
     */
    getQuickLocation(config) {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true,
                timeout: Math.min(config.timeout, 8000), // Max 8 seconds for quick
                maximumAge: 0 // Always fresh
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = this.parsePosition(position);
                    console.log('📍 Quick location:', locationData);
                    resolve(locationData);
                },
                (error) => reject(error),
                options
            );
        });
    }

    /**
     * Get location with continuous watching for better precision
     */
    getWatchLocation(config) {
        return new Promise((resolve, reject) => {
            let bestPosition = null;
            let attempts = 0;
            const maxAttempts = 5;
            const startTime = Date.now();

            const options = {
                enableHighAccuracy: true,
                timeout: config.timeout,
                maximumAge: 0
            };

            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    attempts++;
                    const locationData = this.parsePosition(position);
                    
                    console.log(`🎯 Watch attempt ${attempts}/${maxAttempts}:`, locationData);

                    // Update best position if this is more accurate
                    if (!bestPosition || locationData.accuracy < bestPosition.accuracy) {
                        bestPosition = locationData;
                        
                        // Update progress
                        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                        this.updateProgressUI(`🎯 Improving... ±${Math.round(locationData.accuracy)}m (${elapsed}s)`);
                    }

                    // If we have good accuracy, resolve immediately
                    if (locationData.accuracy <= config.accuracyThreshold) {
                        console.log('✅ Target accuracy achieved!');
                        this.stopWatching();
                        resolve(bestPosition);
                    }
                    // If we've tried enough times, use best position
                    else if (attempts >= maxAttempts) {
                        console.log('⏱️ Max attempts reached, using best position');
                        this.stopWatching();
                        resolve(bestPosition);
                    }
                },
                (error) => {
                    this.stopWatching();
                    // If we have a position from previous attempts, use it
                    if (bestPosition) {
                        console.log('⚠️ Error but using best position:', bestPosition);
                        resolve(bestPosition);
                    } else {
                        reject(error);
                    }
                },
                options
            );

            // Fallback timeout
            setTimeout(() => {
                if (bestPosition) {
                    console.log('⏱️ Timeout reached, using best position');
                    this.stopWatching();
                    resolve(bestPosition);
                } else {
                    this.stopWatching();
                    reject(new Error('Location timeout - no position acquired'));
                }
            }, config.timeout);
        });
    }

    /**
     * Start continuous tracking
     */
    startContinuousTracking(callback, accuracyThreshold = 50) {
        if (this.isTracking) {
            console.log('Already tracking');
            return;
        }

        this.isTracking = true;
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
        };

        this.watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const locationData = this.parsePosition(position);
                
                // Only callback if accuracy is acceptable
                if (locationData.accuracy <= accuracyThreshold) {
                    const enriched = await this.enrichLocationData(locationData, true);
                    callback(enriched, null);
                }
            },
            (error) => {
                callback(null, this.handleLocationError(error));
            },
            options
        );

        console.log('📡 Started continuous GPS tracking');
    }

    /**
     * Stop tracking
     */
    stopTracking() {
        this.stopWatching();
        this.isTracking = false;
        console.log('⏹️ Stopped GPS tracking');
    }

    /**
     * Stop watching position
     */
    stopWatching() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    /**
     * Parse position object
     */
    parsePosition(position) {
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
        };
    }

    /**
     * Enrich location data with address information
     */
    async enrichLocationData(locationData, getAddress = true) {
        const result = {
            coordinates: {
                latitude: Number(locationData.latitude.toFixed(7)),
                longitude: Number(locationData.longitude.toFixed(7)),
                accuracy: Math.round(locationData.accuracy)
            },
            timestamp: locationData.timestamp,
            raw: locationData
        };

        if (getAddress) {
            try {
                const address = await this.getAddressFromCoordinates(
                    locationData.latitude,
                    locationData.longitude
                );
                result.address = address;
            } catch (error) {
                console.warn('Address lookup failed:', error);
                result.address = {
                    formattedAddress: `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
                    error: error.message
                };
            }
        }

        return result;
    }

    /**
     * Get address from coordinates with multiple API fallbacks
     */
    async getAddressFromCoordinates(lat, lng, retryCount = 0) {
        const api = this.geocodingAPIs[retryCount];
        
        if (!api) {
            throw new Error('All geocoding APIs failed');
        }

        try {
            console.log(`🗺️ Trying ${api.name} API...`);
            
            const response = await fetch(api.url(lat, lng), {
                headers: {
                    'User-Agent': 'FoodDeliveryApp/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const parsed = api.parse(data);
            
            if (parsed && parsed.formattedAddress) {
                console.log(`✅ ${api.name} success:`, parsed);
                return parsed;
            }
            
            throw new Error('Invalid response format');

        } catch (error) {
            console.warn(`❌ ${api.name} failed:`, error.message);
            
            // Try next API
            if (retryCount < this.geocodingAPIs.length - 1) {
                await this.sleep(500); // Small delay between attempts
                return this.getAddressFromCoordinates(lat, lng, retryCount + 1);
            }
            
            throw new Error('All geocoding services failed');
        }
    }

    /**
     * Parse Nominatim response
     */
    parseNominatim(data) {
        if (!data || !data.address) {
            throw new Error('Invalid Nominatim response');
        }

        const addr = data.address;
        return {
            formattedAddress: data.display_name,
            street: addr.road || addr.pedestrian || addr.footway || '',
            area: addr.suburb || addr.neighbourhood || addr.residential || '',
            city: addr.city || addr.town || addr.village || addr.municipality || '',
            state: addr.state || addr.state_district || '',
            country: addr.country || '',
            pincode: addr.postcode || '',
            landmark: addr.amenity || addr.building || ''
        };
    }

    /**
     * Parse OpenCage response
     */
    parseOpenCage(data) {
        if (!data || !data.results || data.results.length === 0) {
            throw new Error('Invalid OpenCage response');
        }

        const result = data.results[0];
        const comp = result.components;
        
        return {
            formattedAddress: result.formatted,
            street: comp.road || comp.street || '',
            area: comp.suburb || comp.neighbourhood || '',
            city: comp.city || comp.town || comp.village || '',
            state: comp.state || comp.state_district || '',
            country: comp.country || '',
            pincode: comp.postcode || '',
            landmark: comp.building || comp.amenity || ''
        };
    }

    /**
     * Parse BigDataCloud response
     */
    parseBigDataCloud(data) {
        if (!data) {
            throw new Error('Invalid BigDataCloud response');
        }

        return {
            formattedAddress: [
                data.locality,
                data.city,
                data.principalSubdivision,
                data.countryName
            ].filter(Boolean).join(', '),
            street: data.localityInfo?.administrative?.[5]?.name || '',
            area: data.locality || '',
            city: data.city || '',
            state: data.principalSubdivision || '',
            country: data.countryName || '',
            pincode: data.postcode || '',
            landmark: ''
        };
    }

    /**
     * Check if geolocation is supported
     */
    isGeolocationSupported() {
        return 'geolocation' in navigator;
    }

    /**
     * Handle location errors
     */
    handleLocationError(error) {
        const errors = {
            1: 'Permission denied. Please enable location access in browser settings.',
            2: 'Position unavailable. Check if GPS/WiFi is enabled.',
            3: 'Request timeout. Poor GPS signal or slow connection.'
        };

        const message = errors[error.code] || error.message || 'Unknown location error';
        console.error('❌ Location error:', message);
        
        return new Error(message);
    }

    /**
     * Utility: Sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Show progress UI
     */
    showProgressUI(message) {
        // Remove existing progress
        this.hideProgressUI();

        const div = document.createElement('div');
        div.id = 'gps-progress-overlay';
        div.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            z-index: 10000;
            text-align: center;
            min-width: 280px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        div.innerHTML = `
            <div class="spinner" style="
                border: 3px solid rgba(255,255,255,0.3);
                border-top: 3px solid white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            "></div>
            <div id="gps-progress-message" style="font-size: 14px;">${message}</div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(div);
    }

    /**
     * Update progress UI message
     */
    updateProgressUI(message) {
        const msgElement = document.getElementById('gps-progress-message');
        if (msgElement) {
            msgElement.textContent = message;
        }
    }

    /**
     * Hide progress UI
     */
    hideProgressUI() {
        const overlay = document.getElementById('gps-progress-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Get distance between two coordinates (in meters)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }

    /**
     * Format accuracy level
     */
    getAccuracyLevel(accuracy) {
        if (accuracy < 10) return { level: 'Excellent', icon: '🎯', color: '#10b981' };
        if (accuracy < 30) return { level: 'Very Good', icon: '✅', color: '#22c55e' };
        if (accuracy < 50) return { level: 'Good', icon: '👍', color: '#84cc16' };
        if (accuracy < 100) return { level: 'Fair', icon: '⚠️', color: '#eab308' };
        return { level: 'Poor', icon: '❌', color: '#ef4444' };
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.EnhancedGPS = EnhancedGPS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedGPS;
}
