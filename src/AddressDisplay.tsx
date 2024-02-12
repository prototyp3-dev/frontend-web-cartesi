import React from 'react';

interface AddressDisplayProps {
  address: string;
  bold?: boolean;
  showFullAddress?: boolean;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, bold = false, showFullAddress = false }) => {
  const displayAddress = showFullAddress ? address : `${address.slice(0, 5)}..${address.slice(-3)}`;
  return <span style={{ fontWeight: bold ? 'bold' : 'normal' }}>{displayAddress}</span>;
};

export default AddressDisplay;
