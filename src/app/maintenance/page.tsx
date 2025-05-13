'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  Warning, 
  Refresh, 
  Email, 
  AccessTime, 
  ContentCopy
} from '@mui/icons-material';
import dayjs from 'dayjs';
import "@Styles/Tools-DateAndTime.sass"

/**
 * Maintenance page displayed during emergency shutdown
 */
export default function MaintenancePage() {
  return (
    <Suspense fallback={<MaintenancePageSkeleton />}>
      
      <MaintenanceContent />
    </Suspense>
  );
}

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const [reason, setReason] = useState<string>('Please Try Again Later');
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Update the current time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    // Get reason from URL if provided
    const urlReason = searchParams.get('reason');
    if (urlReason) {
      setReason(decodeURIComponent(urlReason));
    }
    
    // Get estimated time if available
    const estimatedEndTime = searchParams.get('estimatedEnd');
    if (estimatedEndTime) {
      const endTime = new Date(decodeURIComponent(estimatedEndTime));
      setEstimatedTime(formatDateTime(endTime));
      
      // Update countdown timer
      const timer = setInterval(() => {
        const remaining = calculateTimeRemaining(endTime);
        if (remaining) {
          setTimeRemaining(remaining);
        } else {
          clearInterval(timer);
          setTimeRemaining('Refreshing...');
          // Attempt to reload after countdown ends
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [searchParams]);
  
  // Format date for display
  const formatDateTime = (date: Date): string => {
    return dayjs(date).format('dddd, MMMM D, YYYY h:mm A');
  };
  
  // Calculate time remaining
  const calculateTimeRemaining = (endTime: Date): string | null => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  return (
    <div className="Page DateAndTime">
      <h1 className="title">Emergency Maintenance</h1>
      <p className="description">{reason}</p>

      {/* Main status display - similar to clock-container */}
      <div className="clock-container glass">
        <div className="clock-header">
          <h2>System Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>Services Unavailable</span>
          </div>
        </div>
        
        {timeRemaining && (
          <>
            <div className="clock-display">{timeRemaining}</div>
            <div className="clock-date">Time Remaining</div>
          </>
        )}
        
        {!timeRemaining && (
          <>
            <div className="clock-display">OFFLINE</div>
            <div className="clock-date">Services temporarily unavailable</div>
          </>
        )}
        
        <div className="clock-info">
          <div className="info-item">
            <div className="info-label">Current Time</div>
            <div className="info-value">{dayjs(currentDate).format('HH:mm:ss')}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Incident Time</div>
            <div className="info-value">{dayjs(currentDate).format('YYYY-MM-DD')}</div>
          </div>
          {estimatedTime && (
            <div className="info-item">
              <div className="info-label">Estimated Recovery</div>
              <div className="info-value">{estimatedTime}</div>
            </div>
          )}
          <div className="info-item">
            <div className="info-label">Status</div>
            <div className="info-value text-red-500">Emergency Maintenance</div>
          </div>
        </div>
      </div>

      {/* Utility tools */}
      <div className="utilities-container">
        {/* What to Do */}
        <div className="utility-box glass">
          <div className="utility-header">
            <h2>What Should I Do?</h2>
            <Warning />
          </div>
          <div className="utility-content">
            <ul className="list-disc pl-5 dark:text-slate-300 space-y-3">
              <li>Please check back later</li>
              <li>Follow our social media for the latest updates</li>
              <li>No action is required on your part</li>
              <li>Your data is safe and will not be affected by this maintenance</li>
              <li>The system will resume normal operation automatically</li>
            </ul>
            
            <div className="mt-6 flex justify-center gap-4">
              <button 
                className="calculate-button"
                onClick={() => window.location.reload()}
              >
                <Refresh style={{ marginRight: '0.5rem' }} /> Try Refreshing
              </button>
              
              <button 
                className="calculate-button secondary"
                onClick={() => window.location.href = "mailto:meet@meetbhingradiya.dev"}
              >
                <Email style={{ marginRight: '0.5rem' }} /> Contact Developer
              </button>
            </div>
          </div>
        </div>

        {/* Current Time Formats */}
        <div className="utility-box glass">
          <div className="utility-header">
            <h2>Current Time</h2>
            <AccessTime />
          </div>
          <div className="utility-content">
            <div className="format-examples">
              <div className="format-item">
                <div className="format-pattern">Local Time:</div>
                <div className="format-result">{currentDate.toLocaleTimeString()}</div>
                <div className="copy-btn" onClick={() => copyToClipboard(currentDate.toLocaleTimeString())}>
                  <ContentCopy fontSize="small" />
                </div>
              </div>
              <div className="format-item">
                <div className="format-pattern">Date:</div>
                <div className="format-result">{currentDate.toLocaleDateString()}</div>
                <div className="copy-btn" onClick={() => copyToClipboard(currentDate.toLocaleDateString())}>
                  <ContentCopy fontSize="small" />
                </div>
              </div>
              <div className="format-item">
                <div className="format-pattern">ISO 8601:</div>
                <div className="format-result">{currentDate.toISOString()}</div>
                <div className="copy-btn" onClick={() => copyToClipboard(currentDate.toISOString())}>
                  <ContentCopy fontSize="small" />
                </div>
              </div>
              <div className="format-item">
                <div className="format-pattern">UTC:</div>
                <div className="format-result">{dayjs(currentDate).format('YYYY-MM-DD HH:mm:ss')}</div>
                <div className="copy-btn" onClick={() => copyToClipboard(dayjs(currentDate).format('YYYY-MM-DD HH:mm:ss'))}>
                  <ContentCopy fontSize="small" />
                </div>
              </div>
              <div className="format-item">
                <div className="format-pattern">Unix Timestamp:</div>
                <div className="format-result">{Math.floor(currentDate.getTime() / 1000)}</div>
                <div className="copy-btn" onClick={() => copyToClipboard(String(Math.floor(currentDate.getTime() / 1000)))}>
                  <ContentCopy fontSize="small" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

// Skeleton component that renders while the main content is loading
function MaintenancePageSkeleton() {
  return (
    <div className="Page DateAndTime">
      <h1 className="title">Emergency Maintenance</h1>
      <p className="description">Loading system status...</p>
      
      <div className="clock-container glass">
        <div className="clock-header">
          <h2>System Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span>Loading Status...</span>
          </div>
        </div>
        
        <div className="clock-display">LOADING</div>
        <div className="clock-date">Please wait...</div>
        
        <div className="clock-info">
          <div className="info-item">
            <div className="info-label">Status</div>
            <div className="info-value">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  );
}