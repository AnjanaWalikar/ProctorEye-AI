import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  Button,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import _ from 'lodash';

// components
import Profile from './Profile';
import { IconMenu } from '@tabler/icons-react';
import { useSelector } from 'react-redux';

const Header = (props) => {
  // const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  // const lgDown = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { userInfo } = useSelector((state) => state.auth);

  // Handle case when userInfo is null (not yet loaded)
  if (!userInfo) {
    return null;
  }

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: '2px',
    background: theme.palette.background.paper,
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    [theme.breakpoints.up('lg')]: {
      minHeight: '70px',
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.text.secondary,
  }));

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={props.toggleMobileSidebar}
          sx={{
            display: {
              lg: 'none',
              xs: 'inline',
            },
          }}
        >
          <IconMenu width="20" height="20" />
        </IconButton>

        <Box flexGrow={1} />
        <Stack spacing={1} direction="row" alignItems="center">
          <Typography variant="contained" color="primary">
            Hello, {userInfo?.name ? _.startCase(userInfo.name) : 'User'}
          </Typography>
          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
