import Joi from "joi";

const validateReportInput = (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().min(3).max(100).required(),
        description: Joi.string().max(1000).allow(null, ""),
        image_url: Joi.string().uri().allow(null, ""),
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }   
    next();
};

const validateUpvoteInput = (req, res, next) => {
    const schema = Joi.object({
        report_id: Joi.string().uuid().required(),  

    });
    const { error } = schema.validate(req.body);    
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }   

    next();
};

export { validateReportInput, validateUpvoteInput };