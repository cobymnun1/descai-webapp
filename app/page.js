'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import Navbar from './test/Navbar';

export default function Home() {
  const router = useRouter();
  
  // Left chunk state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [textFilename, setTextFilename] = useState(null);
  const [reviewId, setReviewId] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const fileInputRef = useRef(null);

  // Load recent reviews on mount
  useEffect(() => {
    loadRecentReviews();
  }, []);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('[class*="searchContainer"]');
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load 8 most recent reviews from database (no filtering)
  const loadRecentReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      
      if (response.ok) {
        setRecentReviews(data.reviews.slice(0, 8));
      } else {
        console.error('Failed to load reviews:', data.error);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Handle file upload and auto-convert
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError(null);
    setReviewId(null);
    setTextFilename(null);
    setUploading(true);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      setUploadedFilename(uploadData.filename);

      // Step 2: Automatically convert
      setUploading(false);
      setConverting(true);

      const convertResponse = await fetch('/api/covert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: uploadData.filename }),
      });

      const convertData = await convertResponse.json();

      if (!convertResponse.ok) {
        throw new Error(convertData.error || 'Conversion failed');
      }

      setTextFilename(convertData.textFilename);
      setConverting(false);

    } catch (err) {
      setError(err.message);
      setUploading(false);
      setConverting(false);
    }
  };

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!textFilename) return;

    setAnalyzing(true);
    setError(null);

    try {
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textFilename }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        throw new Error(analyzeData.error || 'Analysis failed');
      }

      // Extract recordId from database response
      if (analyzeData.database?.recordId) {
        setReviewId(analyzeData.database.recordId);
        // Refresh the reviews list
        loadRecentReviews();
      } else {
        throw new Error('Analysis completed but failed to save to database');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // Handle search input change
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (!value.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      
      if (response.ok) {
        const searchLower = value.toLowerCase();
        const filtered = data.reviews.filter(review => 
          review.title?.toLowerCase().includes(searchLower) ||
          review.paper_id?.toLowerCase().includes(searchLower)
        );
        setSearchResults(filtered);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Error searching reviews:', err);
    }
  };

  const isProcessing = uploading || converting || analyzing;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
        <div className={styles.chunksWrapper}>
          {/* Left Chunk: Upload & Analyze */}
          <div className={styles.leftChunk}>
        <h2 className={styles.chunkTitle}>Upload & Analyze</h2>

        {/* Drag and Drop Zone */}
        <div
          className={`${styles.dropZone} ${dragActive ? styles.active : ''} ${isProcessing ? styles.processing : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={isProcessing ? null : handleSelectFileClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.docx,.doc,.odt,.rtf,.epub"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />
          
          <div className={styles.dropZoneContent}>
            {uploading && (
              <>
                <div className={styles.spinner}></div>
                <p>Uploading...</p>
              </>
            )}
            {converting && (
              <>
                <div className={styles.spinner}></div>
                <p>Converting to text...</p>
              </>
            )}
            {!isProcessing && (
              <>
                <svg className={styles.uploadIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p className={styles.dropZoneText}>
                  {file ? file.name : 'Drag file here or click to browse'}
                </p>
                <p className={styles.dropZoneSubtext}>
                  PDF, DOCX, TXT, MD accepted
                </p>
              </>
            )}
          </div>
        </div>

        {/* Select File Button */}
        {!isProcessing && (
          <button
            onClick={handleSelectFileClick}
            className={styles.selectFileButton}
          >
            Select File
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!textFilename || analyzing || uploading || converting}
          className={`${styles.analyzeButton} ${textFilename && !isProcessing ? styles.enabled : ''}`}
        >
          {analyzing ? 'Analyzing...' : 'Analyze with AI'}
        </button>

        {/* View Review Button */}
        {reviewId && (
          <button
            onClick={() => router.push(`/review/${reviewId}`)}
            className={styles.viewReviewButton}
          >
            View Review
          </button>
        )}
        </div>

        {/* Right Chunk: Recent Reviews */}
        <div className={styles.rightChunk}>
        <h2 className={styles.chunkTitle}>Recent Reviews</h2>

        {loadingReviews ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading reviews...</p>
          </div>
        ) : recentReviews.length === 0 ? (
          <p className={styles.emptyState}>No reviews yet. Upload and analyze a paper to get started!</p>
        ) : (
          <div className={styles.reviewsList}>
            {recentReviews.map((review) => (
              <Link
                key={review.id}
                href={`/review/${review.id}`}
                className={styles.reviewRow}
              >
                <div className={styles.reviewTitle}>
                  {review.title || 'Untitled Paper'}
                </div>
                <div className={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString('en-US')}
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
        </div>

        {/* Search Bar Section */}
        <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <svg 
            className={styles.searchIcon} 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search reviews by title or paper ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowDropdown(true)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(false);
                setSearchResults([]);
              }}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showDropdown && (
          <div className={styles.searchDropdown}>
            {searchResults.length > 0 ? (
              searchResults.map((review) => (
                <Link
                  key={review.id}
                  href={`/review/${review.id}`}
                  className={styles.dropdownRow}
                  onClick={() => {
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                >
                  <div className={styles.dropdownPaperId}>
                    {review.paper_id}
                  </div>
                  <div className={styles.dropdownTitle}>
                    {review.title || 'Untitled Paper'}
                  </div>
                  <div className={styles.dropdownDate}>
                    {new Date(review.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.noResults}>
                No reviews found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className={styles.pageFooter}>
        <p className={styles.footerText}>
          Developed by DeScAi Project Team<br />
          Blockchain Business Lab, Stony Brook University
        </p>
      </footer>
      </div>
    </>
  );
}
