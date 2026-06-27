'use client';

import Link from 'next/link';

const WA_LINK =
  'https://wa.me/919410903791?text=Hi%2C%20I%20have%20a%20question%20about%20your%20sneakers';

export default function WhatsAppFloat() {
  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-40">
      {/* Pulse ring behind the button */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ backgroundColor: '#25D366', animation: 'wa-pulse 2s ease-out infinite' }}
        aria-hidden="true"
      />

      <Link
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="relative group flex items-center rounded-full shadow-xl overflow-hidden"
        style={{ backgroundColor: '#25D366' }}
      >
        {/* Label — expands on hover */}
        <span
          className="overflow-hidden whitespace-nowrap text-white text-sm font-bold leading-none
                     max-w-0 pl-0 pr-0
                     group-hover:max-w-[9rem] group-hover:pl-5 group-hover:pr-2
                     transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          aria-hidden="true"
        >
          Chat With Us
        </span>

        {/* Icon — always visible */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 26 26"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13.0005 21.492C11.5141 21.492 10.056 21.0984 8.76481 20.3517L5.45597 21.492L6.13567 17.9878C5.06988 16.5266 4.50781 14.8082 4.50781 12.9987C4.50781 8.31574 8.31759 4.50586 13.0005 4.50586C17.6837 4.50586 21.4935 8.31574 21.4935 12.9987C21.4935 17.682 17.6837 21.492 13.0005 21.492ZM8.91725 18.9628L9.17317 19.123C10.3264 19.8461 11.6501 20.2282 13.0003 20.2282C16.987 20.2282 20.23 16.9852 20.23 12.9987C20.23 9.01263 16.987 5.76959 13.0003 5.76959C9.01435 5.76959 5.7714 9.01263 5.7714 12.9987C5.7714 14.6206 6.30272 16.1574 7.30691 17.4426L7.48452 17.6697L7.11282 19.5844L8.91725 18.9628Z"
              fill="white"
            />
            <path
              d="M8.71329 9.7375C8.71329 9.7375 9.2119 8.86647 9.61794 8.8167C10.0242 8.7667 10.5473 8.76669 10.6881 9.03225C10.8293 9.29757 11.4595 10.841 11.4595 10.841C11.4595 10.841 11.5677 11.1065 11.4018 11.3638C11.2359 11.6209 10.8626 11.9941 10.8626 11.9941C10.8626 11.9941 10.6552 12.2595 10.8626 12.5418C11.07 12.8236 11.3917 13.3423 12.0574 14.0071C12.7219 14.6725 13.9983 15.1469 13.9983 15.1469C13.9983 15.1469 14.181 15.1716 14.2973 15.0556C14.4131 14.9394 15.044 14.1512 15.044 14.1512C15.044 14.1512 15.2463 13.8901 15.5828 14.0435C15.9187 14.1968 17.3746 14.9228 17.3746 14.9228C17.3746 14.9228 17.5449 14.9849 17.5449 15.2421C17.5449 15.4992 17.4409 16.1286 17.2281 16.3412C17.0152 16.5542 16.3933 17.21 15.4582 17.21C14.5234 17.21 12.2972 16.4492 11.1109 15.2631C9.92455 14.0765 8.87118 12.8733 8.62257 11.7786C8.37349 10.6835 8.4069 10.1886 8.71329 9.7375Z"
              fill="white"
            />
          </svg>
        </div>
      </Link>
    </div>
  );
}
