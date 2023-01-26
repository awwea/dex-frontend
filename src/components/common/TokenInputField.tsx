import { Imager } from 'components/common/imager/Imager';
import { ChangeEvent, FC, useRef, useState } from 'react';
import { Token } from 'libs/tokens';
import { prettifyNumber, sanitizeNumberInput } from 'utils/helpers';

type Props = {
  title?: string;
  value: string;
  setValue: (value: string) => void;
  token: Token;
  placeholder?: string;
  balance?: string;
  isBalanceLoading: boolean;
  error?: string | false;
  onErrorClick?: () => void;
  className?: string;
  onKeystroke?: () => void;
  isLoading?: boolean;
};

export const TokenInputField: FC<Props> = ({
  title = 'Amount',
  value,
  setValue,
  token,
  balance,
  isBalanceLoading,
  error,
  onErrorClick,
  className,
  onKeystroke,
  placeholder = 'Enter Amount',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOnFocus = () => {
    setIsFocused(true);
  };

  const handleOnBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeNumberInput(e.target.value, token.decimals);
    setValue(sanitized);
    onKeystroke && onKeystroke();
  };

  const handleBalanceClick = () => {
    balance && setValue(balance);
    onKeystroke && onKeystroke();
  };

  return (
    <>
      <div className={'flex justify-between text-14'}>
        <div className={'text-white/50'}>{title}</div>
        <div
          className={`font-weight-500 text-red ${
            onErrorClick ? 'cursor-pointer' : ''
          }`}
          onClick={onErrorClick}
        >
          {error}
        </div>
      </div>
      <div
        className={`cursor-text ${
          isFocused || isActive ? 'ring-2 ring-white/50' : ''
        } transition-all duration-200 ${
          error ? 'ring-2 ring-red/50' : ''
        } ${className}`}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onClick={() => {
          setIsFocused(true);
          inputRef.current?.focus();
        }}
      >
        <div className={`flex items-center justify-between`}>
          <div className={'mr-10 flex flex-none items-center'}>
            <Imager
              alt={'Token'}
              src={token.logoURI}
              className={'mr-10 h-30 w-30 rounded-full'}
            />
            <span className={'font-weight-500'}>{token.symbol}</span>
          </div>
          {
            <input
              ref={inputRef}
              value={
                value === '...'
                  ? value
                  : !isFocused
                  ? !value
                    ? ''
                    : !isActive
                    ? value
                    : value
                  : value
              }
              size={1}
              onChange={handleChange}
              placeholder={placeholder}
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              className={`w-full shrink bg-transparent text-right font-mono text-20 font-weight-500 focus:outline-none ${
                error ? 'text-red' : 'text-white'
              }`}
            />
          }
        </div>

        <button
          onClick={handleBalanceClick}
          className={
            'text-secondary group mt-10 flex items-center p-5 font-mono !text-12 font-weight-600'
          }
        >
          Wallet:{' '}
          {isBalanceLoading ? (
            'loading'
          ) : balance ? (
            <>
              {prettifyNumber(balance)}{' '}
              <div className="ml-10 group-hover:text-white">MAX</div>
            </>
          ) : (
            'not logged in'
          )}
        </button>
      </div>
    </>
  );
};