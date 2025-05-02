import { useAccount, useBalance } from 'wagmi'
import { ethers, formatEther } from 'ethers'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useEffect, useState } from 'react'
import { getErc20Contract } from '../../util/erc20'
import { CONTRACT_ADDRESSES } from '../../constants/env'

export function Header() {
  const { address, chain, isConnected } = useAccount()
  const { open } = useWeb3Modal()
  const { data: balance, refetch: refetchNativeBalance } = useBalance({ address })

  const [balanceMTK, setBalanceMTK] = useState<bigint | null>(null)

  const fetchMTKBalance = async () => {
    if (!address || !isConnected) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contractMTK = getErc20Contract(CONTRACT_ADDRESSES.MY_TOKEN_ADDRESS, provider)
      const amount = await contractMTK.balanceOf(address)
      setBalanceMTK(amount)
    } catch (error) {
      console.error("Failed to fetch MTK balance:", error)
    }
  }

  useEffect(() => {
    if (!address || !isConnected) return

    fetchMTKBalance()
    refetchNativeBalance()

    const interval = setInterval(() => {
      fetchMTKBalance()
      refetchNativeBalance()
    }, 3_000)

    return () => clearInterval(interval)
  }, [address, isConnected])

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">NFT Marketplace</h1>
          {address ? (
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-600">
                <p>Network: <span className="font-medium">{chain?.name || 'Not Connected'}</span></p>
                <p>Balance: <span className="font-medium">{balance ? `${formatEther(balance.value)} ${balance.symbol}` : '0'}</span></p>
                <p>
                  MTK Balance:{' '}
                  <span className="font-medium">
                    {balanceMTK !== null ? `${formatEther(balanceMTK)} MTK` : '0 MTK'}
                  </span>
                </p>
              </div>
              <div onClick={() => open()} className="bg-gray-100 rounded-lg px-4 py-2 cursor-pointer">
                <p className="text-sm font-medium text-gray-900">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>
              </div>
            </div>
          ) : (
            <div onClick={() => open()} className="bg-gray-100 rounded-lg px-4 py-2 cursor-pointer">
              <p className="text-sm font-medium text-gray-900">
                Connect Wallet
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
