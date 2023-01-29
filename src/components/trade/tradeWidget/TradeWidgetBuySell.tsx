import { UseQueryResult } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { Button } from 'components/common/button';
import { TokenInputField } from 'components/common/TokenInputField';
import { useBuySell } from 'components/trade/tradeWidget/useBuySell';
import { useDuplicateStrategy } from 'components/strategies/create/useDuplicateStrategy';
import { Token } from 'libs/tokens';
import { prettifyNumber } from 'utils/helpers';
import { ReactComponent as IconWarning } from 'assets/icons/warning.svg';

export type TradeWidgetBuySellProps = {
  source: Token;
  target: Token;
  buy?: boolean;
  sourceBalanceQuery: UseQueryResult<string>;
  targetBalanceQuery: UseQueryResult<string>;
};

export const TradeWidgetBuySell = (props: TradeWidgetBuySellProps) => {
  const {
    sourceInput,
    setSourceInput,
    targetInput,
    setTargetInput,
    rate,
    onInputChange,
    handleCTAClick,
    bySourceQuery,
    byTargetQuery,
    liquidityQuery,
    errorMsgSource,
    errorMsgTarget,
  } = useBuySell(props);
  const { duplicate } = useDuplicateStrategy();
  const { buy, source, target, sourceBalanceQuery, targetBalanceQuery } = props;
  const hasEnoughLiquidity = +liquidityQuery?.data! > 0;

  if (!source || !target) return null;

  const renderNotEnoughLiquidity = () => {
    return (
      <>
        <div className="text-14 text-white/50">Amount</div>
        <div className="t-grey mt-5 min-h-[228px] flex-1">
          <div
            className={`flex h-full flex-col items-center
          justify-center rounded-12 border border-red/100 px-[4rem] text-center text-14 font-weight-400`}
          >
            <div className="mb-16 flex flex h-38 w-38 items-center justify-center rounded-full bg-red/10">
              <IconWarning className="h-16 w-16 fill-red/100" />
            </div>
            <div className="mb-8 font-weight-500">No Liquidity Available</div>
            <div>No available orders at this moment.</div>
            <div>
              {`You can `}
              <span
                onClick={() => duplicate({ token0: source, token1: target })}
                className="cursor-pointer font-weight-500"
              >
                Create a Strategy.
              </span>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`flex flex-col rounded-12 bg-silver p-20`}>
      <h2 className={'mb-20'}>{buy ? 'Buy' : 'Sell'}</h2>
      {hasEnoughLiquidity ? (
        <>
          <TokenInputField
            className={'mt-5 mb-20 rounded-12 bg-black p-16'}
            token={source}
            isBalanceLoading={false}
            value={sourceInput}
            setValue={setSourceInput}
            balance={sourceBalanceQuery.data}
            error={errorMsgSource}
            onKeystroke={() => onInputChange(true)}
            isLoading={byTargetQuery.isFetching}
          />

          <TokenInputField
            className={'mt-5 rounded-t-12 rounded-b-4 bg-black p-16'}
            token={target}
            title={'Total'}
            isBalanceLoading={false}
            value={targetInput}
            setValue={setTargetInput}
            placeholder={'Total Amount'}
            balance={targetBalanceQuery.data}
            onKeystroke={() => onInputChange(false)}
            isLoading={bySourceQuery.isFetching}
            error={errorMsgTarget}
            onErrorClick={() => {
              setTargetInput(liquidityQuery.data || '0');
              onInputChange(false);
            }}
          />
          <div
            className={
              'mt-5 rounded-b-12 rounded-t-4 bg-black p-16 font-mono text-14 text-white/80'
            }
          >
            {!rate ? (
              '...'
            ) : buy ? (
              <>
                1 {target.symbol} = {rate ? prettifyNumber(rate) : '--'}{' '}
                {source.symbol}
              </>
            ) : (
              <>
                1 {source.symbol} ={' '}
                {rate ? prettifyNumber(new BigNumber(1).div(rate)) : '--'}{' '}
                {target.symbol}
              </>
            )}
          </div>

          {liquidityQuery.data && (
            <div className={'text-secondary mt-5 text-right'}>
              Liquidity: {prettifyNumber(liquidityQuery.data)} {target.symbol}
            </div>
          )}
        </>
      ) : (
        renderNotEnoughLiquidity()
      )}
      <Button
        disabled={!hasEnoughLiquidity}
        onClick={handleCTAClick}
        variant={buy ? 'success' : 'error'}
        fullWidth
        className={'mt-20'}
      >
        {buy ? 'Buy' : 'Sell'}
      </Button>
    </div>
  );
};
