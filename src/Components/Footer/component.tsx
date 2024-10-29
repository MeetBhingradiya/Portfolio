"use Client"

import React from 'react';
import "@Styles/Footer.sass";
import { motion } from 'framer-motion';

function Footer() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className={"Footer"}
        >
            All rights reserved. Meet Bhingradiya © 2021 - {new Date().getFullYear()}
        </motion.div>
    )
}

export default Footer