/**
 *  @FileID          app/Tools/DateAndTime/page.tsx
 *  @Description     Date & Time Utility tool with multiple features
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 29/03/25 11:05 AM IST (Kolkata +5:30 UTC)
 *  @modified 29/03/25 11:05 AM IST (Kolkata +5:30 UTC)
 */

"use client";

import React, { useState, useEffect } from "react";
import "@Styles/Tools-DateAndTime.sass";
import { 
    AccessTime,
    CalendarMonth,
    ContentCopy,
    Timelapse,
    Schedule,
    Compare,
    Public 
} from "@mui/icons-material";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayOfYear from 'dayjs/plugin/dayOfYear';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(advancedFormat);
dayjs.extend(localizedFormat);
dayjs.extend(dayOfYear);

// Common timezone options
const commonTimezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'EST/EDT - New York' },
    { value: 'America/Los_Angeles', label: 'PST/PDT - Los Angeles' },
    { value: 'Europe/London', label: 'GMT/BST - London' },
    { value: 'Europe/Paris', label: 'CET/CEST - Paris' },
    { value: 'Asia/Tokyo', label: 'JST - Tokyo' },
    { value: 'Asia/Shanghai', label: 'CST - Shanghai' },
    { value: 'Asia/Kolkata', label: 'IST - India' },
    { value: 'Australia/Sydney', label: 'AEST/AEDT - Sydney' },
];

// Format the date when displayed
const formatDate = (date: Date): string => {
    return dayjs(date).format('dddd, MMMM D, YYYY');
};

// Format time for display
const formatTime = (date: Date): string => {
    return dayjs(date).format('HH:mm:ss');
};

// Main component
export default function DateAndTime() {
    // State for the current date and time
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    
    // State for the selected timezone
    const [selectedTimezone, setSelectedTimezone] = useState<string>(
        Intl.DateTimeFormat().resolvedOptions().timeZone // Default to local timezone
    );

    // Update the current time every second
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    // State for age calculator
    const [birthDate, setBirthDate] = useState<string>('');
    const [birthTime, setBirthTime] = useState<string>('');
    const [ageResult, setAgeResult] = useState<any>(null);

    // State for timestamp converter
    const [timestamp, setTimestamp] = useState<string>('');
    const [timestampUnit, setTimestampUnit] = useState<'seconds' | 'milliseconds'>('milliseconds');
    const [timestampResult, setTimestampResult] = useState<Date | null>(null);

    // State for date string converter
    const [dateString, setDateString] = useState<string>('');
    const [dateStringResult, setDateStringResult] = useState<Date | null>(null);

    // State for relative time calculator
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [relativeTimeResult, setRelativeTimeResult] = useState<any>(null);

    // Handle timezone change
    const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTimezone(e.target.value);
    };

    // Format the current time based on the selected timezone
    const getFormattedTimeInTimezone = (): string => {
        const tzTime = dayjs(currentDate).tz(selectedTimezone);
        return tzTime.format('HH:mm:ss');
    };

    // Format the current date based on the selected timezone
    const getFormattedDateInTimezone = (): string => {
        const tzDate = dayjs(currentDate).tz(selectedTimezone);
        return tzDate.format('dddd, MMMM D, YYYY');
    };

    // Copy text to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="Page DateAndTime">
            <h1 className="title">Date & Time Utility</h1>
            <p className="description">Powerful date and time tools for conversion, calculation, and formatting</p>

            {/* Main clock display */}
            <div className="clock-container glass">
                <div className="clock-header">
                    <h2>Current Time</h2>
                    <select 
                        className="timezone-select"
                        value={selectedTimezone}
                        onChange={handleTimezoneChange}
                    >
                        {commonTimezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                                {tz.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="clock-display">{getFormattedTimeInTimezone()}</div>
                <div className="clock-date">{getFormattedDateInTimezone()}</div>
                
                <div className="clock-info">
                    <div className="info-item">
                        <div className="info-label">Timezone</div>
                        <div className="info-value">{selectedTimezone}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">Unix Timestamp</div>
                        <div className="info-value">{Math.floor(currentDate.getTime() / 1000)}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">UTC Time</div>
                        <div className="info-value">{dayjs(currentDate).utc().format('HH:mm:ss')}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-label">Day of Year</div>
                        <div className="info-value">{dayjs(currentDate).dayOfYear()}</div>
                    </div>
                </div>
            </div>

            {/* Utility tools */}
            <div className="utilities-container">
                {/* Age Calculator */}
                <div className="utility-box glass">
                    <div className="utility-header">
                        <h2>Age Calculator</h2>
                        <CalendarMonth />
                    </div>
                    <div className="utility-content">
                        <div className="input-group">
                            <label>Birth Date</label>
                            <input 
                                type="date" 
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                max={dayjs().format('YYYY-MM-DD')}
                            />
                        </div>
                        
                        <div className="input-group">
                            <label>Birth Time (optional)</label>
                            <input 
                                type="time" 
                                value={birthTime}
                                onChange={(e) => setBirthTime(e.target.value)}
                            />
                        </div>
                        
                        <button 
                            className="calculate-button"
                            onClick={() => calculateAge(birthDate, birthTime, setAgeResult)}
                        >
                            Calculate Age
                        </button>
                        
                        {ageResult && (
                            <div className="result-container">
                                <div className="result-title">Your Age</div>
                                <div className="result-grid">
                                    <div className="result-item">
                                        <div className="result-label">Years</div>
                                        <div className="result-value">{ageResult.years}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Months</div>
                                        <div className="result-value">{ageResult.months}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Days</div>
                                        <div className="result-value">{ageResult.days}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Hours</div>
                                        <div className="result-value">{ageResult.hours}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Minutes</div>
                                        <div className="result-value">{ageResult.minutes}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Seconds</div>
                                        <div className="result-value">{ageResult.seconds}</div>
                                    </div>
                                </div>
                                
                                <div className="result-text" style={{ marginTop: '1rem' }}>
                                    You&apos;ve been alive for <span>{ageResult.totalDays.toLocaleString()}</span> days or <span>{ageResult.totalHours.toLocaleString()}</span> hours.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timestamp Converter */}
                <div className="utility-box glass">
                    <div className="utility-header">
                        <h2>Timestamp Converter</h2>
                        <Schedule />
                    </div>
                    <div className="utility-content">
                        <div className="input-group">
                            <label>Enter Timestamp</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    value={timestamp}
                                    onChange={(e) => setTimestamp(e.target.value)}
                                    placeholder="e.g., 1617184800000"
                                    style={{ flex: 1 }}
                                />
                                <select 
                                    value={timestampUnit}
                                    onChange={(e) => setTimestampUnit(e.target.value as 'seconds' | 'milliseconds')}
                                    style={{ width: '130px' }}
                                >
                                    <option value="milliseconds">Milliseconds</option>
                                    <option value="seconds">Seconds</option>
                                </select>
                            </div>
                        </div>
                        
                        <button 
                            className="calculate-button"
                            onClick={() => convertTimestamp(timestamp, timestampUnit, setTimestampResult)}
                        >
                            Convert
                        </button>
                        
                        {timestampResult && (
                            <div className="result-container">
                                <div className="result-title">Converted Date & Time</div>
                                <div className="result-grid">
                                    <div className="result-item">
                                        <div className="result-label">Date</div>
                                        <div className="result-value">{dayjs(timestampResult).format('YYYY-MM-DD')}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Time</div>
                                        <div className="result-value">{dayjs(timestampResult).format('HH:mm:ss')}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Day</div>
                                        <div className="result-value">{dayjs(timestampResult).format('dddd')}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">UTC</div>
                                        <div className="result-value">{dayjs(timestampResult).utc().format('YYYY-MM-DD HH:mm:ss')}</div>
                                    </div>
                                </div>
                                
                                <div className="format-examples">
                                    <div className="format-item">
                                        <div className="format-pattern">ISO 8601:</div>
                                        <div className="format-result">{timestampResult.toISOString()}</div>
                                        <div className="copy-btn" onClick={() => copyToClipboard(timestampResult.toISOString())}>
                                            <ContentCopy fontSize="small" />
                                        </div>
                                    </div>
                                    <div className="format-item">
                                        <div className="format-pattern">Locale String:</div>
                                        <div className="format-result">{timestampResult.toLocaleString()}</div>
                                        <div className="copy-btn" onClick={() => copyToClipboard(timestampResult.toLocaleString())}>
                                            <ContentCopy fontSize="small" />
                                        </div>
                                    </div>
                                    <div className="format-item">
                                        <div className="format-pattern">Human Friendly:</div>
                                        <div className="format-result">{dayjs(timestampResult).format('dddd, MMMM D, YYYY h:mm A')}</div>
                                        <div className="copy-btn" onClick={() => copyToClipboard(dayjs(timestampResult).format('dddd, MMMM D, YYYY h:mm A'))}>
                                            <ContentCopy fontSize="small" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date String Converter */}
                <div className="utility-box glass">
                    <div className="utility-header">
                        <h2>Date String Converter</h2>
                        <Compare />
                    </div>
                    <div className="utility-content">
                        <div className="input-group">
                            <label>Enter Date String</label>
                            <input 
                                type="text" 
                                value={dateString}
                                onChange={(e) => setDateString(e.target.value)}
                                placeholder="e.g., March 31, 2023 or 2023-03-31T12:00:00"
                            />
                        </div>
                        
                        <button 
                            className="calculate-button"
                            onClick={() => convertDateString(dateString, setDateStringResult)}
                        >
                            Parse Date
                        </button>
                        
                        {dateStringResult && (
                            <div className="result-container">
                                <div className="result-title">Parsed Date & Time</div>
                                <div className="result-grid">
                                    <div className="result-item">
                                        <div className="result-label">Timestamp (ms)</div>
                                        <div className="result-value">{dateStringResult.getTime()}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Timestamp (s)</div>
                                        <div className="result-value">{Math.floor(dateStringResult.getTime() / 1000)}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">ISO Date</div>
                                        <div className="result-value">{dateStringResult.toISOString().split('T')[0]}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">UTC Time</div>
                                        <div className="result-value">{dayjs(dateStringResult).utc().format('HH:mm:ss')}</div>
                                    </div>
                                </div>
                                
                                <div className="format-examples">
                                    <div className="format-item">
                                        <div className="format-pattern">ISO 8601:</div>
                                        <div className="format-result">{dateStringResult.toISOString()}</div>
                                        <div className="copy-btn" onClick={() => copyToClipboard(dateStringResult.toISOString())}>
                                            <ContentCopy fontSize="small" />
                                        </div>
                                    </div>
                                    <div className="format-item">
                                        <div className="format-pattern">Locale String:</div>
                                        <div className="format-result">{dateStringResult.toLocaleString()}</div>
                                        <div className="copy-btn" onClick={() => copyToClipboard(dateStringResult.toLocaleString())}>
                                            <ContentCopy fontSize="small" />
                                        </div>
                                    </div>
                                    <div className="format-item">
                                        <div className="format-pattern">Human Friendly:</div>
                                        <div className="format-result">{dayjs(dateStringResult).format('dddd, MMMM D, YYYY h:mm A')}</div>
                                        <div className="copy-btn" onClick={() => copyToClipboard(dayjs(dateStringResult).format('dddd, MMMM D, YYYY h:mm A'))}>
                                            <ContentCopy fontSize="small" />
                                        </div>
                                    </div>
                                    <div className="format-item">
                                        <div className="format-pattern">Relative:</div>
                                        <div className="format-result">{dayjs(dateStringResult).fromNow()}</div>
                                        <div className="copy-btn" onClick={() => copyToClipboard(dayjs(dateStringResult).fromNow())}>
                                            <ContentCopy fontSize="small" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Relative Time Calculator */}
                <div className="utility-box glass">
                    <div className="utility-header">
                        <h2>Relative Time Calculator</h2>
                        <Timelapse />
                    </div>
                    <div className="utility-content">
                        <div className="input-group">
                            <label>Start Date</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        
                        <div className="input-group">
                            <label>End Date</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        
                        <button 
                            className="calculate-button"
                            onClick={() => calculateRelativeTime(startDate, endDate, setRelativeTimeResult)}
                        >
                            Calculate
                        </button>
                        
                        {relativeTimeResult && (
                            <div className="result-container">
                                <div className="result-title">Time Difference</div>
                                <div className="result-grid">
                                    <div className="result-item">
                                        <div className="result-label">Days</div>
                                        <div className="result-value">{relativeTimeResult.days}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Weeks</div>
                                        <div className="result-value">{relativeTimeResult.weeks}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Months</div>
                                        <div className="result-value">{relativeTimeResult.months}</div>
                                    </div>
                                    <div className="result-item">
                                        <div className="result-label">Years</div>
                                        <div className="result-value">{relativeTimeResult.years}</div>
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '1rem' }}>
                                    <div className="result-text">
                                        Human-readable: <span>{relativeTimeResult.humanReadable}</span>
                                    </div>
                                    <div className="result-text">
                                        {relativeTimeResult.startDate.toLocaleDateString()} is <span>{relativeTimeResult.fromNow}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Time Format Showcase */}
                <div className="utility-box glass">
                    <div className="utility-header">
                        <h2>Current Time Formats</h2>
                        <Public />
                    </div>
                    <div className="utility-content">
                        <div className="format-examples">
                            <div className="format-item">
                                <div className="format-pattern">ISO 8601:</div>
                                <div className="format-result">{currentDate.toISOString()}</div>
                                <div className="copy-btn" onClick={() => copyToClipboard(currentDate.toISOString())}>
                                    <ContentCopy fontSize="small" />
                                </div>
                            </div>
                            <div className="format-item">
                                <div className="format-pattern">UTC:</div>
                                <div className="format-result">{dayjs(currentDate).utc().format('YYYY-MM-DD HH:mm:ss')}</div>
                                <div className="copy-btn" onClick={() => copyToClipboard(dayjs(currentDate).utc().format('YYYY-MM-DD HH:mm:ss'))}>
                                    <ContentCopy fontSize="small" />
                                </div>
                            </div>
                            <div className="format-item">
                                <div className="format-pattern">Unix Timestamp (s):</div>
                                <div className="format-result">{Math.floor(currentDate.getTime() / 1000)}</div>
                                <div className="copy-btn" onClick={() => copyToClipboard(String(Math.floor(currentDate.getTime() / 1000)))}>
                                    <ContentCopy fontSize="small" />
                                </div>
                            </div>
                            <div className="format-item">
                                <div className="format-pattern">Unix Timestamp (ms):</div>
                                <div className="format-result">{currentDate.getTime()}</div>
                                <div className="copy-btn" onClick={() => copyToClipboard(String(currentDate.getTime()))}>
                                    <ContentCopy fontSize="small" />
                                </div>
                            </div>
                            <div className="format-item">
                                <div className="format-pattern">US Format:</div>
                                <div className="format-result">{dayjs(currentDate).format('MM/DD/YYYY h:mm:ss A')}</div>
                                <div className="copy-btn" onClick={() => copyToClipboard(dayjs(currentDate).format('MM/DD/YYYY h:mm:ss A'))}>
                                    <ContentCopy fontSize="small" />
                                </div>
                            </div>
                            <div className="format-item">
                                <div className="format-pattern">EU Format:</div>
                                <div className="format-result">{dayjs(currentDate).format('DD/MM/YYYY HH:mm:ss')}</div>
                                <div className="copy-btn" onClick={() => copyToClipboard(dayjs(currentDate).format('DD/MM/YYYY HH:mm:ss'))}>
                                    <ContentCopy fontSize="small" />
                                </div>
                            </div>
                            <div className="format-item">
                                <div className="format-pattern">RFC 2822:</div>
                                <div className="format-result">{dayjs(currentDate).format('ddd, DD MMM YYYY HH:mm:ss ZZ')}</div>
                                <div className="copy-btn" onClick={() => copyToClipboard(dayjs(currentDate).format('ddd, DD MMM YYYY HH:mm:ss ZZ'))}>
                                    <ContentCopy fontSize="small" />
                                </div>
                            </div>
                            <div className="format-item">
                                <div className="format-pattern">Human Friendly:</div>
                                <div className="format-result">{dayjs(currentDate).format('dddd, MMMM D, YYYY h:mm A')}</div>
                                <div className="copy-btn" onClick={() => copyToClipboard(dayjs(currentDate).format('dddd, MMMM D, YYYY h:mm A'))}>
                                    <ContentCopy fontSize="small" />
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '1.5rem' }}>
                            <div className="result-title">World Clock</div>
                            <div className="result-grid">
                                <div className="result-item">
                                    <div className="result-label">New York</div>
                                    <div className="result-value">{dayjs(currentDate).tz('America/New_York').format('HH:mm:ss')}</div>
                                </div>
                                <div className="result-item">
                                    <div className="result-label">London</div>
                                    <div className="result-value">{dayjs(currentDate).tz('Europe/London').format('HH:mm:ss')}</div>
                                </div>
                                <div className="result-item">
                                    <div className="result-label">Tokyo</div>
                                    <div className="result-value">{dayjs(currentDate).tz('Asia/Tokyo').format('HH:mm:ss')}</div>
                                </div>
                                <div className="result-item">
                                    <div className="result-label">Sydney</div>
                                    <div className="result-value">{dayjs(currentDate).tz('Australia/Sydney').format('HH:mm:ss')}</div>
                                </div>
                                <div className="result-item">
                                    <div className="result-label">India</div>
                                    <div className="result-value">{dayjs(currentDate).tz('Asia/Kolkata').format('HH:mm:ss')}</div>
                                </div>
                                <div className="result-item">
                                    <div className="result-label">Dubai</div>
                                    <div className="result-value">{dayjs(currentDate).tz('Asia/Dubai').format('HH:mm:ss')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Calculate age from birth date and time
function calculateAge(
    birthDateStr: string, 
    birthTimeStr: string, 
    setResult: React.Dispatch<React.SetStateAction<any>>
) {
    if (!birthDateStr) {
        alert('Please enter a birth date');
        return;
    }

    const now = dayjs();
    let birthDate: dayjs.Dayjs;

    if (birthTimeStr) {
        // Combine date and time
        birthDate = dayjs(`${birthDateStr}T${birthTimeStr}`);
    } else {
        // Use only date
        birthDate = dayjs(birthDateStr);
    }

    if (!birthDate.isValid()) {
        alert('Invalid date or time format');
        return;
    }

    if (birthDate.isAfter(now)) {
        alert('Birth date cannot be in the future');
        return;
    }

    // Calculate duration from birth to now
    const duration = dayjs.duration(now.diff(birthDate));

    // Calculate total days and hours for additional stats
    const totalDays = Math.floor(duration.asDays());
    const totalHours = Math.floor(duration.asHours());

    // Extract individual components
    const years = duration.years();
    const months = duration.months();
    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    setResult({
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        totalDays,
        totalHours,
        birthDate: birthDate.toDate(),
        now: now.toDate(),
    });
}

// Convert timestamp to date
function convertTimestamp(
    timestampStr: string, 
    unit: 'seconds' | 'milliseconds', 
    setResult: React.Dispatch<React.SetStateAction<Date | null>>
) {
    if (!timestampStr) {
        alert('Please enter a timestamp');
        return;
    }

    const timestamp = parseInt(timestampStr);
    if (isNaN(timestamp)) {
        alert('Invalid timestamp');
        return;
    }

    let date: Date;
    
    if (unit === 'seconds') {
        date = new Date(timestamp * 1000);
    } else {
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
        alert('Invalid timestamp');
        return;
    }

    setResult(date);
}

// Convert date string to date object
function convertDateString(
    dateStr: string, 
    setResult: React.Dispatch<React.SetStateAction<Date | null>>
) {
    if (!dateStr) {
        alert('Please enter a date string');
        return;
    }

    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
        alert('Invalid date format');
        return;
    }

    setResult(date);
}

// Calculate time difference between two dates
function calculateRelativeTime(
    startDateStr: string, 
    endDateStr: string, 
    setResult: React.Dispatch<React.SetStateAction<any>>
) {
    if (!startDateStr || !endDateStr) {
        alert('Please enter both start and end dates');
        return;
    }

    const startDate = dayjs(startDateStr);
    const endDate = dayjs(endDateStr);

    if (!startDate.isValid() || !endDate.isValid()) {
        alert('Invalid date format');
        return;
    }

    // Calculate duration between dates
    const duration = dayjs.duration(endDate.diff(startDate));
    const days = Math.abs(duration.asDays());
    const weeks = Math.abs(days / 7);
    const months = Math.abs(duration.asMonths());
    const years = Math.abs(duration.asYears());

    // Human readable format
    const humanReadable = startDate.from(endDate, true);
    const fromNow = startDate.from(endDate);

    setResult({
        days: Math.floor(days),
        weeks: Math.floor(weeks),
        months: Math.floor(months),
        years: Math.floor(years),
        duration,
        humanReadable,
        fromNow,
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
    });
}
