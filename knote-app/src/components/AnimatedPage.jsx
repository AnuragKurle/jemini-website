import React from 'react';

const AnimatedPage = ({ children }) => {
    return (
        <div className="animate-page-enter w-full h-full">
            {children}
        </div>
    );
};

export default AnimatedPage;
