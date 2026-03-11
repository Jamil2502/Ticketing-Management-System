import React from "react";
import { QRCodeCanvas } from "qrcode.react";

interface QrCodeProps {
    id: string;
    eventTitle?: string;
}

const QrCode: React.FC<QrCodeProps> = ({ id, eventTitle }) => {
    return (
        <div className="flex flex-col items-center">
            <QRCodeCanvas value={id} size={200} />
            {eventTitle && <p className="mt-2 text-center">{eventTitle}</p>}
        </div>
    );
};

export default QrCode;