import React, { Component } from 'react';
import CustomSnackbar from './Helpers/Snackbar';
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true, error });
    
    // You can log the error or send it to a logging service here
  }

  render() {
    if (this.state.hasError) {
      // Render an error message and redirect to the home page
      return (
       <CustomSnackbar/>
      );
    }

    // If no error occurred, render the child components
    return this.props.children;
  }
}

export default ErrorBoundary;
