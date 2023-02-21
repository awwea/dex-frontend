import conf from './config.json';

export interface Config {
  tokens: {
    ETH: string;
    WETH: string;
    BNT: string;
    ZERO: string;
    USDT: string;
    USDC: string;
    DAI: string;
    WBTC: string;
    SHIB: string;
    ENJ: string;
    UNI: string;
    LINK: string;
    LDO: string;
    APE: string;
    GRT: string;
    AAVE: string;
    CRV: string;
  };
  carbon: {
    carbonController: string;
    voucher: string;
  };
  utils: {
    multicall: string;
  };
}

export const config: Config = {
  ...conf,
};
