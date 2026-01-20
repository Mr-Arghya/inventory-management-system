
/**
 * Sends a standardized JSON response.
 *
 * @param {object} res - Express response object
 * @param {string} status - 'success' or 'error'
 * @param {any} data - Data to send in response (null if error)
 * @param {string|object|null} error - Error message or object (null if success)
 * @param {string} message - Message describing the response
 */
function sendResponse(res, status, message, data = null, error = null) {
  if (error) {
    console.log(data, "<-----------ERROR");
  }
  res.status(status).send({
    status,
    error,
    message : message,
    data : data ,
  });
}

module.exports = {
  sendResponse,
};


