const ActivityBox = ({ day, activity, color , date}) => {
    console.log("Date",date)
    return (
      <div style={{ backgroundColor: color, padding: '10px', margin: '10px', borderRadius: '10px' , width : "10%" }}>
        <h2>{day}</h2>
        <p>{date}</p>
        <p>{activity}</p>
      </div>
    );
  };
  
  export default ActivityBox;