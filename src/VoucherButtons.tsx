import { BigNumber } from "ethers";
import React, { useEffect } from "react";
import { useVouchersQuery, useVoucherQuery } from "./generated/graphql";
import { useRollups } from "./useRollups";

interface IVoucherButtons {
  dappAddress: string;
  conversationId: number;
  responseId: number;
  reloadVouchers?: React.MutableRefObject<() => void>;
}

export const VoucherButtons: React.FC<IVoucherButtons> = ({ dappAddress, conversationId, responseId, reloadVouchers }) => {
  const [result, reexecuteQuery] = useVouchersQuery();
  const [voucherResult, reexecuteVoucherQuery] = useVoucherQuery({
    variables: { voucherIndex: responseId, inputIndex: conversationId }//, pause: !!voucherIdToFetch
  });
  const [voucherToExecute, setVoucherToExecute] = React.useState<any>();
  const { data, fetching, error } = result;
  const rollups = useRollups(dappAddress);

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
    if (reloadVouchers) {
      reloadVouchers.current = reload;
    }
  }, [reloadVouchers]);

  const reload = () => {
    reexecuteQuery({ requestPolicy: 'network-only' });
    reexecuteVoucherQuery({ requestPolicy: 'network-only' });
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

  // const forceUpdate = useForceUpdate();
  return (
    <>
      {voucherToExecute ? <>
        < button disabled={!voucherToExecute.proof || voucherToExecute.executed} onClick={() => executeVoucher(voucherToExecute)}>{voucherToExecute.proof ? (voucherToExecute.executed ? <>{voucherToExecute.index} Posted</> : <>Post {voucherToExecute.index}</>) : <>{voucherToExecute.index} no proof yet</>}</button>
      </> : <p>Nothing yet</p>
      }
    </>
  );
};
