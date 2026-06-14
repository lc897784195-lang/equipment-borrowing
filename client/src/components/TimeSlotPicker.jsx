import React, { useState } from 'react';
const TimeSlotPicker = ({ slots, onSelect, selectedRange }) => {
  const [selecting, setSelecting] = useState(false);
  const [startSlot, setStartSlot] = useState(null);
  const handleSlotClick = (time, status) => {
    if (status === 'booked') return;
    if (!selecting) { setStartSlot(time); setSelecting(true); }
    else { onSelect(startSlot, time); setSelecting(false); setStartSlot(null); }
  };
  const isSelected = (time) => selectedRange && time >= selectedRange.start && time < selectedRange.end;
  const isSelectingRange = (time) => selecting && startSlot && time >= startSlot;
  return (
    <div className="grid grid-cols-8 gap-1">
      {slots.map(({ time, status }) => (
        <button key={time} onClick={() => handleSlotClick(time, status)} disabled={status === 'booked'}
          className={`p-2 text-xs rounded ${status === 'booked' ? 'bg-red-200 text-red-800 cursor-not-allowed' : isSelected(time) ? 'bg-blue-500 text-white' : isSelectingRange(time) ? 'bg-blue-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
          {time}
        </button>
      ))}
    </div>
  );
};
export default TimeSlotPicker;