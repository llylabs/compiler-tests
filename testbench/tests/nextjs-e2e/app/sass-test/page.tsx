import styles from './page.module.scss';

export default function SassTestPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Sass Test</h1>
      <ul>
        <li className={styles.active}>Active item</li>
        <li>Plain item</li>
      </ul>
    </div>
  );
}
