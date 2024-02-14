import { BigNumber } from "ethers";
import React, { useEffect } from "react";
import { useVouchersQuery, useVoucherQuery } from "./generated/graphql";
import { useRollups } from "./useRollups";

interface IVoucherButtons {
  dappAddress: string;
  conversationId: number;
  responseId: number;
}

export const VoucherButtons: React.FC<IVoucherButtons> = ({ dappAddress, conversationId, responseId }) => {
  const [result, reexecuteQuery] = useVouchersQuery();
  const [voucherToFetch, setVoucherToFetch] = React.useState([responseId, conversationId]);
  const [voucherResult, reexecuteVoucherQuery] = useVoucherQuery({
    variables: { voucherIndex: voucherToFetch[0], inputIndex: voucherToFetch[1] }//, pause: !!voucherIdToFetch
  });
  const [voucherToExecute, setVoucherToExecute] = React.useState<any>();
  const { data, fetching, error } = result;
  const rollups = useRollups(dappAddress);

  const getProofInputIndex = async (input: number, index: number) => {
    setVoucherToFetch([index, input]);
    reexecuteVoucherQuery({ requestPolicy: 'network-only' });
    console.log("getProofInputIndex", input, index, voucherToFetch);
  };

  const executeVoucher = async (voucher: any) => {
    if (rollups && !!voucher.proof) {

      const newVoucherToExecute = { ...voucher };
      try {
        const tx = await rollups.dappContract.executeVoucher(voucher.destination, voucher.payload, voucher.proof);
        const receipt = await tx.wait();
        newVoucherToExecute.msg = `voucher executed! (tx="${tx.hash}")`;
        if (receipt.events) {
          newVoucherToExecute.msg = `${newVoucherToExecute.msg} - resulting events: ${JSON.stringify(receipt.events)}`;
          newVoucherToExecute.executed = await rollups.dappContract.wasVoucherExecuted(BigNumber.from(voucher.input.index), BigNumber.from(voucher.index));
        }
      } catch (e) {
        newVoucherToExecute.msg = `COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`;
        console.log(`COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`);
      }
      setVoucherToExecute(newVoucherToExecute);
    }
  }

  useEffect(() => {
    const setVoucher = async (voucher: any) => {
      if (rollups) {
        voucher.executed = await rollups.dappContract.wasVoucherExecuted(BigNumber.from(voucher.input.index), BigNumber.from(voucher.index));
      }
      setVoucherToExecute(voucher);
    }

    if (!voucherResult.fetching && voucherResult.data) {
      setVoucher(voucherResult.data.voucher);
    }
  }, [voucherResult, rollups]);

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  if (!data || !data.vouchers) return <p>No vouchers</p>;

  console.log("voucher", voucherToFetch, voucherResult.data?.voucher);
  console.log("voucherToExecute", voucherToExecute);

  // const forceUpdate = useForceUpdate();
  return (
    <div>
      {/* <button onClick={() => getProofInputIndex(conversationId, responseId)}>Get proof for conversation {conversationId}-{responseId}</button> */}
      {voucherToExecute ? <>
        {voucherToExecute.input.index}-{voucherToExecute.index}
        < button disabled={!voucherToExecute.proof || voucherToExecute.executed} onClick={() => executeVoucher(voucherToExecute)}>{voucherToExecute.proof ? (voucherToExecute.executed ? "Voucher executed" : "Execute voucher") : "No proof yet"}</button>
      </> : <p>Nothing yet</p>
      }
      <button onClick={() => reexecuteQuery({ requestPolicy: 'network-only' })}>
        Reload
      </button>

    </div >
  );
};
