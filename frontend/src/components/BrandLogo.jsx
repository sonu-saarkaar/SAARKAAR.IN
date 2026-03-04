import { useState } from 'react'
import './BrandLogo.css'

export default function BrandLogo({
    size = 'md',
    showWordmark = true,
    className = '',
    onClick,
    alt = 'Sonu Saarkaar Logo'
}) {
    const [imageMissing, setImageMissing] = useState(false)

    return (
        <div
            className={`brand-logo brand-logo--${size} ${className}`.trim()}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            {!imageMissing ? (
                <img
                    src="/brand/sonu-saarkaar-logo.png"
                    alt={alt}
                    className="brand-logo-image"
                    onError={() => setImageMissing(true)}
                    loading="eager"
                />
            ) : (
                <div className="brand-logo-fallback" aria-label="SS Logo Fallback">SS</div>
            )}

            {showWordmark && (
                <div className="brand-logo-wordmark">
                    <span>SONU</span> SAARKAAR
                </div>
            )}
        </div>
    )
}