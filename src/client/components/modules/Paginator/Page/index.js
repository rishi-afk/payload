import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'paginator__page';

const Page = ({ page, isCurrent, updatePage }) => {
  const classes = [
    baseClass,
    isCurrent && `${baseClass}--is-current`,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={() => updatePage(page)}
      type="button"
    >
      {page}
    </button>
  );
};

Page.defaultProps = {
  page: 1,
  isCurrent: false,
  updatePage: null,
};

Page.propTypes = {
  page: PropTypes.number,
  isCurrent: PropTypes.bool,
  updatePage: PropTypes.func,
};

export default Page;