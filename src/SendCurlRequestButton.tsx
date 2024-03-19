import React, { useState } from 'react';

interface ButtonProps {
  url: string;
  data: string;
  buttonText: string;
}

const SendCurlRequestButton: React.FC<ButtonProps> = ({ url, data, buttonText }) => {
 
    const [isSending, setIsSending] = useState(false);

    const handleClick = async () => {
      setIsSending(true);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response:', responseData);
      } catch (error) {
        console.error('Error sending request:', error);
      } finally {
        setIsSending(false);
      }
    };

    return (
      <button disabled={isSending} onClick={handleClick}>
        {isSending ? 'Sending...' : buttonText}
      </button>
    );
  };

  export default SendCurlRequestButton;

