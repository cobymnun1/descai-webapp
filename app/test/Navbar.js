'use client'

import Link from 'next/link';
import styles from './navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        DeScAi
      </div>
      <div className={styles.navButtons}>
        <Link href="/" className={styles.navButton}>
          Home
        </Link>
        <Link href="/viewall" className={styles.navButton}>
          All Reviews
        </Link>
      </div>
    </nav>
  );
}

