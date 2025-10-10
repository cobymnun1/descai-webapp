'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './viewall.module.css';
import Navbar from '../test/Navbar';

export default function ViewAllPage() {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-load reviews on mount
  useEffect(() => {
    loadReviews();
  }, []);

  // Filter reviews when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReviews(reviews);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = reviews.filter(review => 
        review.title?.toLowerCase().includes(query) ||
        review.paper_id?.toLowerCase().includes(query) ||
        review.id?.toString().includes(query)
      );
      setFilteredReviews(filtered);
    }
  }, [searchQuery, reviews]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews);
        setFilteredReviews(data.reviews);
      } else {
        console.error('Failed to load reviews:', data.error);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
        <div className={styles.tableCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>All Reviews</h1>
            <div className={styles.searchWrapper}>
              <svg 
                className={styles.searchIcon} 
                width="18" 
                height="18" 
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
                placeholder="Search by title, paper ID, or review ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={styles.clearButton}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className={styles.emptyState}>
              {searchQuery ? (
                <>
                  <p>No reviews found matching "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} className={styles.clearSearchButton}>
                    Clear Search
                  </button>
                </>
              ) : (
                <p>No reviews yet. Upload and analyze a paper to get started!</p>
              )}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Created At</th>
                    <th>Title</th>
                    <th>Paper ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr key={review.id}>
                      <td className={styles.dateCell}>
                        {new Date(review.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className={styles.titleCell} title={review.title || 'Untitled Paper'}>
                        {review.title || 'Untitled Paper'}
                      </td>
                      <td className={styles.paperIdCell} title={review.paper_id}>
                        {review.paper_id}
                      </td>
                      <td className={styles.actionsCell}>
                        <Link
                          href={`/review/${review.id}`}
                          className={styles.viewButton}
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.tableFooter}>
                <p>
                  Showing {filteredReviews.length} of {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
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

