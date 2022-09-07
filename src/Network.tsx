// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { FC } from "react";
import { useConnectWallet, useSetChain } from "@web3-onboard/react";

export const Network: FC = () => {
    const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
    const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
    return (
        <div>
            <button
                onClick={() =>
                    connect()
                }
            >
                {connecting ? "connecting" : "connect"}
            </button>
            {wallet && (
                <div>
                    <label>Switch Chain</label>
                    {settingChain ? (
                        <span>Switching chain...</span>
                    ) : (
                        <select
                            onChange={({ target: { value } }) => {
                                console.log(value, wallet, connecting, chains, connectedChain, settingChain) ;
                                setChain({ chainId: value })
                                console.log(value, setChain({ chainId: value }).then(d => console.log(d)))
                                }
                            }
                            value={connectedChain?.id}
                        >
                            {chains.map(({ id, label }) => {
                                return (
                                    <option key={id} value={id}>
                                        {label}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                    <button onClick={() => disconnect(wallet)}>
                        Disconnect Wallet
                    </button>
                </div>
            )}
        </div>
    );
};
