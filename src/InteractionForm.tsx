import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useWallets } from "@web3-onboard/react";

interface IInputField {
  name: string;
  value: string;
  description: string;
}

interface IInteractionForm {
  description: string;
  defaultInputs: IInputField[];
  contractFunction: (signer: ethers.Signer, ...args: any[]) => Promise<any>;
  isReadCall?: boolean;
  onInputsChange?: (inputs: IInputField[]) => void; // Callback for when inputs change
}

export const InteractionForm: React.FC<IInteractionForm> = ({ description, defaultInputs, contractFunction, isReadCall, onInputsChange }) => {
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [readResult, setReadResult] = useState<string>('');
  const [connectedWallet] = useWallets();
  const provider = new ethers.providers.Web3Provider(connectedWallet.provider);

  const [inputs, setInputs] = useState<IInputField[]>(defaultInputs);

  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      setInputs(defaultInputs);
      initialRender.current = false;
    }
  }, []); // Removed defaultInputs from dependency array
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (provider) {
        const signer = provider.getSigner();
        if (isReadCall) {
          const result = await contractFunction(signer, ...inputs);
          setReadResult(JSON.stringify(result));
        } else {
          const tx = await contractFunction(signer, ...inputs);
          const receipt = await tx.wait();
          setTransactionHash(receipt.transactionHash);
          console.log('Transaction successful with hash:', receipt.transactionHash);
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {inputs.map((IinputField, index) => (
          <div key={IinputField.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <label htmlFor={IinputField.name}>{IinputField.description}</label>
            <input
              id={IinputField.name}
              type="text"
              value={IinputField.value}
              onChange={(e) => {
                const newInputs = [...inputs];
                newInputs[index] = { ...IinputField, value: e.target.value };
                setInputs(newInputs);
                if (onInputsChange) {

                  onInputsChange(newInputs); // Call the callback function with the new inputs

                }
              }}
              placeholder={IinputField.description}
            />
          </div>
        ))}
        <button type="submit" disabled={!provider} style={{ marginTop: 'auto' }}>{description}</button>
      </form>
      {!isReadCall ? (
        transactionHash && (
          <p>Transaction sent! Hash: {transactionHash}</p>
        )
      ) : (
        readResult && (
          <p>Read call result: {readResult}</p>
        )
      )}
    </div>
  );
};

