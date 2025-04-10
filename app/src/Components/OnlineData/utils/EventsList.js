import React, { useState, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, Checkbox, FormControlLabel, Chip } from '@mui/material';
import dayjs from 'dayjs';

const EventsList = React.memo(({ eventsData, eventStyles }) => {
    const eventTypes = Object.keys(eventsData);
    const [selectedTypes, setSelectedTypes] = useState(eventTypes);

    const handleToggleType = (type) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const handleEventClick = (event) => {
        const { type, minTime, maxTime } = event;
        const url = `/live-event-analytics?eventType=${type}&minTime=${minTime}&maxTime=${maxTime}`;
        window.open(url, '_blank');
    };

    // Efficiently filter and sort events
    const sortedEvents = useMemo(() => {
        return eventTypes
            .filter((type) => selectedTypes.includes(type) && eventsData[type]?.mintime)
            .flatMap((type) =>
                eventsData[type].mintime.map((minTime, index) => ({
                    type,
                    minTime,
                    maxTime: eventsData[type].maxtime[index],
                }))
            )
            .sort((a, b) => new Date(b.maxTime) - new Date(a.maxTime));
    }, [eventsData, selectedTypes]);

    return (
        <Box sx={{ width: '100%', padding: 3, maxWidth: '800px', margin: 'auto' }}>
            <Typography variant="h5" fontWeight="bold" textAlign="center">Event Log</Typography>

            {/* Event Filters */}
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, my: 2 }}>
                {eventTypes.map((type) => (
                    <FormControlLabel
                        key={type}
                        control={
                            <Checkbox
                                checked={selectedTypes.includes(type)}
                                onChange={() => handleToggleType(type)}
                            />
                        }
                        label={
                            <Chip
                                label={type}
                                icon={eventStyles[type]?.icon}
                                sx={{
                                    backgroundColor: eventStyles[type]?.color,
                                    color: 'white',
                                    fontWeight: 'bold',
                                }}
                            />
                        }
                    />
                ))}
            </Box>

            {/* Scrollable Event List */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {sortedEvents.length === 0 ? (
                    <Typography textAlign="center" color="textSecondary" sx={{ mt: 2 }}>
                        No events available.
                    </Typography>
                ) : (
                    <Grid container spacing={2}>
                        {sortedEvents.map((event, index) => {
                            const { type, minTime, maxTime } = event;
                            const { color, icon } = eventStyles[type];

                            return (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card
                                        onClick={() => handleEventClick(event)}
                                        sx={{
                                            borderLeft: `6px solid ${color}`,
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer',
                                            '&:hover': { transform: 'scale(1.05)' },
                                        }}
                                    >
                                        <CardContent>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {icon}
                                                <Typography variant="h6" fontWeight="bold">
                                                    {type.toUpperCase()}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="textSecondary">
                                                Start: {dayjs(minTime).format('HH:mm:ss.SSS')}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                End: {dayjs(maxTime).format('HH:mm:ss.SSS')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Box>
        </Box>
    );
});

export default EventsList;
