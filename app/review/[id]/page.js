'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './review.module.css';
import Navbar from '../../test/Navbar';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.id) {
      loadReview(params.id);
    }
  }, [params.id]);

  const loadReview = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reviews/${id}`);
      const data = await response.json();

      if (response.ok) {
        setReview(data.review);
      } else {
        setError(data.error || 'Failed to load review');
      }
    } catch (err) {
      setError('Error loading review: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const ScoreCard = ({ score, label, color = '#0070f3' }) => {
    const percentage = Math.round((score || 0) * 100);
    return (
      <div className={styles.scoreCard}>
        <div className={styles.scoreLabel}>{label}</div>
        <div className={styles.scoreCircle} style={{ borderColor: color }}>
          <div className={styles.scoreValue}>{percentage}</div>
          <div className={styles.scorePercent}>%</div>
        </div>
      </div>
    );
  };

  const ReviewSection = ({ title, content, icon }) => {
    if (!content) return null;
    
    return (
      <div className={styles.reviewSection}>
        <h3 className={styles.sectionTitle}>
          {icon && <span className={styles.icon}>{icon}</span>}
          {title}
        </h3>
        
        {content.rationale && (
          <div className={styles.subsection}>
            <h4>Rationale</h4>
            <p>{content.rationale}</p>
          </div>
        )}
        
        {content.review_statement && (
          <div className={styles.subsection}>
            <h4>Review Statement</h4>
            <p>{content.review_statement}</p>
          </div>
        )}
        
        {content.replication_caveats && (
          <div className={styles.subsection}>
            <h4>Replication Caveats</h4>
            <p>{content.replication_caveats}</p>
          </div>
        )}
        
        {content.discipline_caveats && (
          <div className={styles.subsection}>
            <h4>Discipline Caveats</h4>
            <p>{content.discipline_caveats}</p>
          </div>
        )}
        
        {content.conflict_of_interest !== undefined && (
          <div className={styles.subsection}>
            <h4>Conflict of Interest</h4>
            <p className={content.conflict_of_interest ? styles.warning : styles.success}>
              {content.conflict_of_interest ? 'Yes - Potential conflicts identified' : 'No conflicts identified'}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Review Not Found</h2>
          <p>The requested review could not be found.</p>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.reportCard}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{review.title || 'Untitled Paper'}</h1>
          <p className={styles.paperId}>Paper ID: <code>{review.paper_id}</code></p>
        </div>

        <div className={styles.scoresGrid}>
          <ScoreCard 
            score={review.originality_score} 
            label="Originality" 
            color="#e91e63"
          />
          <ScoreCard 
            score={review.clarity_score} 
            label="Clarity" 
            color="#2196f3"
          />
          <ScoreCard 
            score={review.rigor_score} 
            label="Rigor" 
            color="#4caf50"
          />
          <ScoreCard 
            score={review.reproducibility_score} 
            label="Reproducibility" 
            color="#ff9800"
          />
          <ScoreCard 
            score={review.data_transparency_score} 
            label="Data Transparency" 
            color="#9c27b0"
          />
          <ScoreCard 
            score={review.interpretation_congruence_score} 
            label="Interpretation" 
            color="#00bcd4"
          />
          {review.field_familiarity_score !== null && review.field_familiarity_score !== undefined && (
            <ScoreCard 
              score={review.field_familiarity_score} 
              label="Field Familiarity" 
              color="#607d8b"
            />
          )}
        </div>

        <div className={styles.divider}></div>

        <ReviewSection 
          title="Originality Review"
          icon="💡"
          content={review.originality_review}
        />

        <ReviewSection 
          title="Clarity Review"
          icon="📝"
          content={review.clarity_review}
        />

        <ReviewSection 
          title="Rigor & Reproducibility Review"
          icon="🔬"
          content={review.rigor_reproducibility_review}
        />

        <ReviewSection 
          title="Data Transparency Review"
          icon="📊"
          content={review.data_transparency_review}
        />

        <ReviewSection 
          title="Interpretation & Ethics Review"
          icon="⚖️"
          content={review.interpretation_ethics_review}
        />

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Developed by DeScAi Project Team<br />
            Blockchain Business Lab, Stony Brook University
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

