import Service from '../models/Service.js'

export async function listServices(req, res, next) {
  try {
    const organizationId = req.organizationId
    const { search, category, status, page = 1, limit = 50 } = req.query

    const filter = { organizationId }

    if (category) filter.category = category
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Service.countDocuments(filter)
    const services = await Service.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.json({
      status: 'success',
      data: {
        services,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)) || 1,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getService(req, res, next) {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found',
      })
    }

    res.json({
      status: 'success',
      data: { service },
    })
  } catch (err) {
    next(err)
  }
}

export async function createService(req, res, next) {
  try {
    const { name, description, category, price, billingType, status } = req.body

    const service = await Service.create({
      organizationId: req.organizationId,
      name,
      description,
      category,
      price,
      billingType,
      status,
    })

    res.status(201).json({
      status: 'success',
      data: { service },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateService(req, res, next) {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      req.body,
      { new: true, runValidators: true }
    )

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found',
      })
    }

    res.json({
      status: 'success',
      data: { service },
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteService(req, res, next) {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    })

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found',
      })
    }

    res.json({
      status: 'success',
      message: 'Service deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}
