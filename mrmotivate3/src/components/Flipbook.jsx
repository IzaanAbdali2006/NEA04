// components/Flipbook.js
import React from 'react';
import styles from './Flipbook.module.css';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const Flipbook = ({ journals }) => {
  return (
    <div className={styles.book}>
      <input type="checkbox" id="coverInput" className={styles.hiddenInput} />
      {journals.map((journal, index) => (
        <div key={index} className={`${styles.page} ${styles[`page${index + 1}`]}`} id={`page${index + 1}`}>
          <div className={styles.frontPage}>
            <p><strong>Date:</strong> {journal.date}</p>
            <p><strong>Highlights:</strong> {journal.highlights}</p>
            <p><strong>What I'm Grateful For:</strong> {journal.what_im_grateful_for}</p>
            <p><strong>Progress:</strong> {journal.progress_things_ive_learnt}</p>
            <p><strong>Things I've Learnt:</strong> {journal.things_ive_learnt}</p>
            {index < journals.length - 1 && (
              <label className={styles.next} htmlFor={`page${index + 1}Input`}>
                <ChevronRight fontSize="large" />
              </label>
            )}
          </div>
          <div className={styles.backPage}>
            {index < journals.length - 1 && (
              <label className={styles.prev} htmlFor={`page${index + 1}Input`}>
                <ChevronLeft fontSize="large" />
              </label>
            )}
          </div>
        </div>
      ))}
      <div className={styles.cover}>
        <label htmlFor="coverInput" className={styles.coverLabel}></label>
      </div>
    </div>
  );
};

export default Flipbook;