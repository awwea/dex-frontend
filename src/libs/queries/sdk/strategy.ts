import { useMutation, useQuery } from '@tanstack/react-query';
import { Token as TokenContract } from 'abis/types';
import { utils } from 'ethers';
import { useWagmi } from 'libs/wagmi';
import { Token } from 'libs/tokens';
import { fetchTokenData } from 'libs/tokens/tokenHelperFn';
import { QueryKey } from 'libs/queries/queryKey';
import { SafeDecimal } from 'libs/safedecimal';
import { useContract } from 'hooks/useContract';
import config from 'config';
import { ONE_DAY_IN_MS } from 'utils/time';
import { useTokens } from 'hooks/useTokens';
import { useCarbonInit } from 'hooks/useCarbonInit';
import { EncodedStrategyBNStr, StrategyUpdate, Strategy as SDKStrategy } from '@bancor/carbon-sdk';
import { MarginalPriceOptions } from '@bancor/carbon-sdk/strategy-management';
import { carbonSDK } from 'libs/sdk';
import { getLowestBits } from 'utils/helpers';
import { RoiRow } from 'utils/carbonApi';
import { useGetRoi } from 'libs/queries/extApi/roi';
import { useGetAddressFromEns } from 'libs/queries/chain/ens';

export type StrategyStatus = 'active' | 'noBudget' | 'paused' | 'inactive';

export interface Order {
    balance: string;
    startRate: string;
    endRate: string;
    marginalRate: string;
}

export interface Strategy {
    id: string;
    idDisplay: string;
    base: Token;
    quote: Token;
    order0: Order;
    order1: Order;
    status: StrategyStatus;
    encoded: EncodedStrategyBNStr;
    roi: SafeDecimal;
}

export interface StrategyWithFiat extends Strategy {
    fiatBudget: {
        total: SafeDecimal;
        quote: SafeDecimal;
        base: SafeDecimal;
    };
}

interface StrategiesHelperProps {
    strategies: SDKStrategy[];
    getTokenById: (id: string) => Token | undefined;
    importToken: (token: Token) => void;
    Token: (address: string) => { read: TokenContract };
    roiData: RoiRow[];
}

const buildStrategiesHelper = async ({
    strategies,
    getTokenById,
    importToken,
    Token,
    roiData,
}: StrategiesHelperProps) => {
    const _getTknData = async (address: string) => {
        const data = await fetchTokenData(Token, address);
        importToken(data);
        return data;
    };

    const promises = strategies.map(async (s) => {
        const base = getTokenById(s.baseToken) || (await _getTknData(s.baseToken));
        const quote = getTokenById(s.quoteToken) || (await _getTknData(s.quoteToken));

        const sellLow = new SafeDecimal(s.sellPriceLow);
        const sellHigh = new SafeDecimal(s.sellPriceHigh);
        const sellBudget = new SafeDecimal(s.sellBudget);

        const buyLow = new SafeDecimal(s.buyPriceLow);
        const buyHight = new SafeDecimal(s.buyPriceHigh);
        const buyBudget = new SafeDecimal(s.buyBudget);

        const offCurve =
            sellLow.isZero() && sellHigh.isZero() && buyLow.isZero() && buyHight.isZero();

        const noBudget = sellBudget.isZero() && buyBudget.isZero();

        const status =
            noBudget && offCurve
                ? 'inactive'
                : offCurve
                ? 'paused'
                : noBudget
                ? 'noBudget'
                : 'active';

        // ATTENTION *****************************
        // This is the buy order | UI order 0 and CONTRACT order 1
        // ATTENTION *****************************
        const order0: Order = {
            balance: s.buyBudget,
            startRate: s.buyPriceLow,
            endRate: s.buyPriceHigh,
            marginalRate: s.buyPriceMarginal,
        };

        // ATTENTION *****************************
        // This is the sell order | UI order 1 and CONTRACT order 0
        // ATTENTION *****************************
        const order1: Order = {
            balance: s.sellBudget,
            startRate: s.sellPriceLow,
            endRate: s.sellPriceHigh,
            marginalRate: s.sellPriceMarginal,
        };

        const roi = new SafeDecimal(roiData.find((r) => r.id === s.id)?.ROI || 0);

        const strategy: Strategy = {
            id: s.id,
            idDisplay: getLowestBits(s.id),
            base,
            quote,
            order0,
            order1,
            status,
            encoded: s.encoded,
            roi,
        };

        return strategy;
    });

    return await Promise.all(promises);
};

interface Props {
    user?: string;
}

export const useGetUserStrategies = ({ user }: Props) => {
    const { isInitialized } = useCarbonInit();
    const { tokens, getTokenById, importToken } = useTokens();
    const { Token } = useContract();

    const ensAddress = useGetAddressFromEns(user || '');
    const address: string = (ensAddress?.data || user || '').toLowerCase();

    const isValidAddress = utils.isAddress(address);
    const isZeroAddress = address === config.addresses.tokens.ZERO;

    const roiQuery = useGetRoi();

    return useQuery<Strategy[]>({
        queryKey: QueryKey.strategies(address),
        queryFn: async () => {
            if (!address || !isValidAddress || isZeroAddress) return [];

            const strategies = await carbonSDK.getUserStrategies(address);
            return buildStrategiesHelper({
                strategies,
                getTokenById,
                importToken,
                Token,
                roiData: roiQuery.data || [],
            });
        },
        enabled: tokens.length > 0 && isInitialized && roiQuery.isFetched && ensAddress.isFetched,
        staleTime: ONE_DAY_IN_MS,
        retry: false,
    });
};

export const useGetStrategy = (id: string) => {
    const { isInitialized } = useCarbonInit();
    const { tokens, getTokenById, importToken } = useTokens();
    const { Token } = useContract();
    const roiQuery = useGetRoi();

    return useQuery<Strategy>({
        queryKey: QueryKey.strategy(id),
        queryFn: async () => {
            const strategy = await carbonSDK.getStrategy(id);
            const strategies = await buildStrategiesHelper({
                strategies: [strategy],
                getTokenById,
                importToken,
                Token,
                roiData: roiQuery.data || [],
            });
            return strategies[0];
        },
        enabled: tokens.length > 0 && isInitialized && roiQuery.isFetched,
        staleTime: ONE_DAY_IN_MS,
        retry: false,
    });
};

interface PropsPair {
    token0?: string;
    token1?: string;
}

export const useGetPairStrategies = ({ token0, token1 }: PropsPair) => {
    const { isInitialized } = useCarbonInit();
    const { tokens, getTokenById, importToken } = useTokens();
    const { Token } = useContract();

    const roiQuery = useGetRoi();

    return useQuery<Strategy[]>({
        queryKey: QueryKey.strategiesByPair(token0, token1),
        queryFn: async () => {
            if (!token0 || !token1) return [];
            const strategies = await carbonSDK.getStrategiesByPair(token0, token1);
            return buildStrategiesHelper({
                strategies,
                getTokenById,
                importToken,
                Token,
                roiData: roiQuery.data || [],
            });
        },
        enabled: tokens.length > 0 && isInitialized && roiQuery.isFetched,
        staleTime: ONE_DAY_IN_MS,
        retry: false,
    });
};

interface CreateStrategyOrder {
    budget: string;
    min: string;
    max: string;
    marginalPrice: string;
}

type TokenAddressDecimals = Pick<Token, 'address' | 'decimals'>;

export interface CreateStrategyParams {
    base: TokenAddressDecimals;
    quote: TokenAddressDecimals;
    order0: CreateStrategyOrder;
    order1: CreateStrategyOrder;
    encoded?: EncodedStrategyBNStr;
}

export interface UpdateStrategyParams {
    id: string;
    encoded: EncodedStrategyBNStr;
    fieldsToUpdate: StrategyUpdate;
    buyMarginalPrice?: MarginalPriceOptions | string;
    sellMarginalPrice?: MarginalPriceOptions | string;
}

export interface DeleteStrategyParams {
    id: string;
}

export const useCreateStrategyQuery = () => {
    const { signer } = useWagmi();

    return useMutation({
        mutationFn: async ({ base, quote, order0, order1 }: CreateStrategyParams) => {
            const unsignedTx = await carbonSDK.createBuySellStrategy(
                base.address,
                quote.address,
                order0.min,
                order0.marginalPrice || order0.max,
                order0.max,
                order0.budget || '0',
                order1.min,
                order1.marginalPrice || order1.min,
                order1.max,
                order1.budget || '0'
            );

            return signer!.sendTransaction(unsignedTx);
        },
    });
};

export const useUpdateStrategyQuery = () => {
    const { signer } = useWagmi();

    return useMutation({
        mutationFn: async ({
            id,
            encoded,
            fieldsToUpdate,
            buyMarginalPrice,
            sellMarginalPrice,
        }: UpdateStrategyParams) => {
            const unsignedTx = await carbonSDK.updateStrategy(
                id,
                encoded,
                {
                    ...fieldsToUpdate,
                },
                buyMarginalPrice,
                sellMarginalPrice
            );

            return signer!.sendTransaction(unsignedTx);
        },
    });
};

export const useDeleteStrategyQuery = () => {
    const { signer } = useWagmi();

    return useMutation({
        mutationFn: async ({ id }: DeleteStrategyParams) => {
            const unsignedTx = await carbonSDK.deleteStrategy(id);

            return signer!.sendTransaction(unsignedTx);
        },
    });
};
