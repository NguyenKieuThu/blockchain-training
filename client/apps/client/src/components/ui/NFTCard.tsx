import { formatEther } from 'ethers'
import { useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useMutateCancelListing } from '../../hooks/useNFT'
import { NFTImage } from './NFTImage'

interface NFTCardProps {
  tokenId: string
  name?: string
  nftAddress?: string
  price?: bigint
  displayCurrency?: string
  seller?: string
  onAction?: () => void
  actionLabel?: string
}

export function NFTCard({
  tokenId,
  name = `NFT #${tokenId}`,
  nftAddress,
  price,
  displayCurrency,
  seller,
  onAction,
  actionLabel,
}: NFTCardProps) {
  const { address } = useAccount()
  const { mutate: cancelListing } = useMutateCancelListing(nftAddress!, tokenId)
  const handleAction = useCallback(() => {
    if (seller === address) {
      cancelListing()
    } else {
      onAction?.()
    }
  }, [address, seller, cancelListing, onAction])
  const formattedPrice = price ? formatEther(price.toString()) : null

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow">
      <div className="aspect-square relative overflow-hidden rounded-t-xl">
        <NFTImage
          nftAddress={nftAddress}
          tokenId={tokenId}
          className="w-full h-full"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
        <div className="mt-2 space-y-2">
          <p className="text-sm text-gray-600">Token ID: {tokenId}</p>
          {formattedPrice && (
            <p className="text-lg font-medium text-gray-900">
              {formattedPrice} {displayCurrency}
            </p>
          )}
          {seller && (
            <p className="text-sm text-gray-500">
              Seller: {seller.slice(0, 6)}...{seller.slice(-4)}
            </p>
          )}
          {onAction && actionLabel && (
            <button
              onClick={handleAction}
              className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
