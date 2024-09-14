import styles from "../components/Quote.module.css";
import Image from "next/image";
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
export default function Quote() {
  return (
    <div className={styles.Quote}>
      <div className={styles.OpeningQuotation}>
        <FormatQuoteIcon style={{ fontSize: "50px", color: "#2A9D8F" }}/>
      </div>
      <div className={styles.ActualQuote}>
        If I am walking with two other men, each of them will serve as my
        teacher. I will pick out the good points of the one and imitate them,
        and the bad points of the other and correct them in myself.
      </div>
      <div className= {styles.ClosingQuotation}>
        <FormatQuoteIcon style={{ fontSize: "50px", color: "#2A9D8F" }}/>
      </div>
    </div>
  );
}
