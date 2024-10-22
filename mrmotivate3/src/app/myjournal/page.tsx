"use client";
import styles from "../page.module.css";
import Navbar from "@/components/Navbar";
import Infobar from "@/components/Infobar";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add"; // Importing Add icon
import { useState, useEffect } from "react";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file
import { DateRangePicker } from "react-date-range";

export default function MyJournal() {
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highlights, setHighlights] = useState("");
  const [gratefulFor, setGratefulFor] = useState("");
  const [progress, setProgress] = useState("");
  const [thingsLearnt, setThingsLearnt] = useState("");
  const [journals, setJournals] = useState([]);

  const userId = localStorage.getItem("userid");

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const response = await fetch(`http://localhost:5000/journals/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Journals:", data); // Log the fetched journals
          setJournals(data);
        } else {
          console.error("Failed to fetch journals");
        }
      } catch (error) {
        console.error("Failed to fetch journals:", error);
      }
    };

    fetchJournals();
  }, [userId]);

  const selectionRange = {
    startDate: startDate,
    endDate: endDate,
    key: "selection",
  };

  const handleSelect = (ranges) => {
    setStartDate(ranges.selection.startDate);
    setEndDate(ranges.selection.endDate);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async () => {
    const formattedDate = new Date().toISOString().split('T')[0];

    try {
      const response = await fetch("http://localhost:5000/journals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: userId,
          date: formattedDate,
          highlights,
          what_im_grateful_for: gratefulFor,
          progress_things_ive_learnt: progress,
          things_ive_learnt: thingsLearnt,
        }),
      });

      if (response.ok) {
        const newJournal = await response.json();
        setJournals([...journals, newJournal]);
        closeModal();
      } else {
        console.error("Failed to add journal entry");
      }
    } catch (error) {
      console.error("Failed to add journal entry:", error);
    }
  };

  // Filter journals based on search input and date range
  const filteredJournals = journals.filter((journal) => {
    const matchesDate =
      new Date(journal.date) >= startDate && new Date(journal.date) <= endDate;

    const matchesSearch =
      (journal.highlights?.toLowerCase().includes(searchInput.toLowerCase()) || false) ||
      (journal.what_im_grateful_for?.toLowerCase().includes(searchInput.toLowerCase()) || false) ||
      (journal.progress_things_ive_learnt?.toLowerCase().includes(searchInput.toLowerCase()) || false) ||
      (journal.things_ive_learnt?.toLowerCase().includes(searchInput.toLowerCase()) || false);

    console.log(`Journal Date: ${journal.date}, Date Match: ${matchesDate}, Search Match: ${matchesSearch}`);
    
    return matchesDate || matchesSearch; // return true if either matches
  });

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.main}>
        <Infobar />
        <div className={styles.headerContainer}>
          <div className={styles.JournalMainLine}>My Journal</div>
          <div onClick={openModal} className={styles.addButton}>
            <AddIcon /> {/* Add icon */}
            Add Journal Entry
          </div>
        </div>
        <div className={styles.JournalSearchBar}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: 1,
              borderRadius: 20,
              paddingLeft: 5,
              background: "white",
            }}
            type="text"
            placeholder="Look back into past journal! Select a range of dates"
          />
          <SearchIcon
            style={{
              color: "white",
              backgroundColor: "#2a9d8f",
              borderRadius: 50,
              padding: 3,
              cursor: "pointer",
            }}
          />
        </div>
        {searchInput && (
          <div className={styles.JournalCalendar}>
            <DateRangePicker
              ranges={[selectionRange]}
              maxDate={new Date()}
              rangeColors={["#2a9d8f"]}
              onChange={handleSelect}
            />
          </div>
        )}

        {/* Display filtered journals */}
        <div className={styles.journalEntries}>
          {filteredJournals.map((journal) => (
            <div key={journal.id} className={styles.journalEntry}>
              <p><strong>Date:</strong> {journal.date}</p>
              <p><strong>Highlights:</strong> {journal.highlights}</p>
              <p><strong>What I'm Grateful For:</strong> {journal.what_im_grateful_for}</p>
              <p><strong>Progress:</strong> {journal.progress_things_ive_learnt}</p>
              <p><strong>Things I've Learnt:</strong> {journal.things_ive_learnt}</p>
            </div>
          ))}
        </div>

        {/* Modal for adding a journal entry */}
        {isModalOpen && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalForm}>
              <h2>Add Journal Entry</h2>
              <label className={styles.modalFormLabel}>Highlights:</label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="What were the highlights of your day?"
                className={styles.modalFormInput}
              />

              <label className={styles.modalFormLabel}>
                What I'm Grateful For:
              </label>
              <textarea
                value={gratefulFor}
                onChange={(e) => setGratefulFor(e.target.value)}
                placeholder="What are you grateful for today?"
                className={styles.modalFormInput}
              />

              <label className={styles.modalFormLabel}>Progress:</label>
              <textarea
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                placeholder="What progress did you make today?"
                className={styles.modalFormInput}
              />

              <label className={styles.modalFormLabel}>
                Things I've Learnt:
              </label>
              <textarea
                value={thingsLearnt}
                onChange={(e) => setThingsLearnt(e.target.value)}
                placeholder="What did you learn today?"
                className={styles.modalFormInput}
              />

              <div className={styles.modalFormButtons}>
                <button
                  onClick={handleSubmit}
                  className={styles.modalFormButton}
                >
                  Submit
                </button>
                <button onClick={closeModal} className={styles.modalFormButton}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




