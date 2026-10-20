const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // হেডার থেকে টোকেন নেওয়া
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ 
            success: false, 
            message: 'প্রবেশ নিষেধ: কোনো সিকিউরিটি টোকেন পাওয়া যায়নি!' 
        });
    }

    // সাধারণত টোকেন আসে 'Bearer <token>' আকারে
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        // টোকেনটি আসল নাকি নকল তা পরীক্ষা করা
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        
        // টোকেন থেকে ইউজারের তথ্য (id, school_id, role) রিকোয়েস্টে যুক্ত করা
        req.user = verified;
        
        // অনুমতি দিয়ে পরবর্তী কাজে পাঠানো
        next();
    } catch (err) {
        res.status(403).json({ 
            success: false, 
            message: 'টোকেনটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে!' 
        });
    }
};

module.exports = verifyToken;
