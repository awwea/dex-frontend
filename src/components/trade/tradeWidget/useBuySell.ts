import { useWeb3 } from 'libs/web3';
import { useModal } from 'libs/modals';
import { useCallback, useEffect, useState } from 'react';
import { config } from 'services/web3/config';
import { useApproval } from 'hooks/useApproval';
import { useGetTradeData } from 'libs/queries/sdk/trade';
import { PopulatedTransaction } from 'ethers';
import { sdk } from 'libs/sdk';
import BigNumber from 'bignumber.js';
import { TradeWidgetBuySellProps } from 'components/trade/tradeWidget/TradeWidgetBuySell';
import { useGetTradeLiquidity } from 'libs/queries/sdk/tradeLiquidity';
import { QueryKey, useQueryClient } from 'libs/queries';

export const useBuySell = ({
  source,
  target,
  sourceBalanceQuery,
}: TradeWidgetBuySellProps) => {
  const cache = useQueryClient();
  const { user, signer } = useWeb3();
  const { openModal } = useModal();
  const [sourceInput, setSourceInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [isTradeBySource, setIsTradeBySource] = useState(true);
  const [tradeActions, setTradeActions] = useState<any[]>([]);
  const [rate, setRate] = useState('');
  const [isLiquidityError, setIsLiquidityError] = useState('');

  const approvalTokens = [
    { ...source, spender: config.carbon.poolCollection, amount: sourceInput },
  ];
  const approval = useApproval(approvalTokens);

  const bySourceQuery = useGetTradeData({
    sourceToken: source.address,
    targetToken: target.address,
    isTradeBySource: true,
    input: sourceInput,
    enabled: isTradeBySource,
  });

  const byTargetQuery = useGetTradeData({
    sourceToken: source.address,
    targetToken: target.address,
    isTradeBySource: false,
    input: targetInput,
    enabled: !isTradeBySource,
  });

  const liquidityQuery = useGetTradeLiquidity(source.address, target.address);

  const checkLiquidity = useCallback(
    (value: string) => {
      const check = (v: string) => new BigNumber(v).times(0.9999).gt(value);
      const set = () => setIsLiquidityError('Insufficient liquidity');
      setIsLiquidityError('');

      if (isTradeBySource) {
        if (check(sourceInput)) {
          return set();
        }
      } else {
        if (check(targetInput)) {
          return set();
        }
      }
    },
    [isTradeBySource, sourceInput, targetInput]
  );

  const tradeAction = async () => {
    if (!user || !signer) {
      throw new Error('No user or signer');
    }

    let unsignedTx: PopulatedTransaction;
    if (isTradeBySource) {
      unsignedTx = await sdk.composeTradeBySourceTransaction(
        source.address,
        target.address,
        tradeActions,
        // TODO handle this
        Date.now() + 1000 * 60 * 60 * 24 * 7,
        1,
        { gasLimit: 999999999 }
      );
    } else {
      unsignedTx = await sdk.composeTradeByTargetTransaction(
        source.address,
        target.address,
        tradeActions,
        // TODO handle this
        Date.now() + 1000 * 60 * 60 * 24 * 7,
        9999999999999999999999999999999999999,
        { gasLimit: 999999999 }
      );
    }

    const tx = await signer.sendTransaction(unsignedTx);
    setSourceInput('');
    setTargetInput('');
    await tx.wait();
    void cache.invalidateQueries(QueryKey.balance(user, source.address));
    void cache.invalidateQueries(QueryKey.balance(user, target.address));
  };

  const handleCTAClick = () => {
    if (!user) {
      openModal('wallet', undefined);
    } else if (approval.approvalRequired) {
      openModal('txConfirm', {
        approvalTokens,
        onConfirm: tradeAction,
        buttonLabel: 'Confirm Trade',
      });
    } else {
      tradeAction();
    }
  };

  const onInputChange = (bySource: boolean) => {
    setIsTradeBySource(bySource);
  };

  useEffect(() => {
    if (bySourceQuery.data) {
      const { totalInput, totalOutput, tradeActions, effectiveRate } =
        bySourceQuery.data;

      setTargetInput(totalOutput);
      setTradeActions(tradeActions);
      setRate(effectiveRate);
      checkLiquidity(totalInput);
    }
  }, [bySourceQuery.data, checkLiquidity]);

  useEffect(() => {
    if (byTargetQuery.data) {
      const { totalInput, totalOutput, tradeActions, effectiveRate } =
        byTargetQuery.data;

      setSourceInput(totalInput);
      setTradeActions(tradeActions);
      setRate(effectiveRate);
      checkLiquidity(totalOutput);
    }
  }, [byTargetQuery.data, checkLiquidity]);

  useEffect(() => {
    setSourceInput('');
    setTargetInput('');
  }, [source.address, target.address]);

  const errorBaseBalanceSufficient =
    !!user &&
    new BigNumber(sourceBalanceQuery.data || 0).lt(sourceInput) &&
    'Insufficient balance';

  return {
    sourceInput,
    setSourceInput,
    targetInput,
    setTargetInput,
    rate,
    onInputChange,
    handleCTAClick,
    errorBaseBalanceSufficient,
    bySourceQuery,
    byTargetQuery,
    approval,
    liquidityQuery,
    isLiquidityError,
  };
};
