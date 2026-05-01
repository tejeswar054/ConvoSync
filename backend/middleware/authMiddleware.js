const jwt = require("jsonwebtoken");

const authMiddleware = (req,res,next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader){
            return res.status(401).json({
                message:"No token provided"
            });
        }

        // remove "Bearer"
        const token = authHeader.replace("Bearer ","");

        // verify token 
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        // attach user to request
        req.user = decoded;
        next();
    } catch(error){
        res.status(401).json({
            message: "Invalid token"
        });
    }
};

module.exports = authMiddleware;