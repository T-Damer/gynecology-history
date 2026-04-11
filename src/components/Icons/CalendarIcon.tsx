export default function ({ onPress }: { onPress: () => void }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="currentColor"
      className="w-4 h-4 cursor-pointer"
      onClick={onPress}
    >
      <path
        d="M146.584,159.045H53.416V71.998h93.168V159.045z M174.443,20.161h16.814V200H8.742V20.161h16.814V0h20.432v20.161h22.388V0
	h20.431v20.161h22.387V0h20.432v20.161h22.389V0h20.43V20.161z M166.584,51.998H33.416v127.047h133.168V51.998z"
      />
    </svg>
  )
}
